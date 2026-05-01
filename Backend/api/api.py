from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import speech_recognition as sr
import tempfile
import os

app = Flask(__name__)
# Enable CORS so the React app (running on a different port) can fetch data
CORS(app)

# Global dictionary to hold the index in memory
inverted_index = {}


def load_index():
    """Loads my_index.txt into a fast dictionary memory structure."""
    print("Loading Inverted Index into memory...")
    try:
        with open("../my_index-small.txt", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or " " not in line:
                    continue

                # Format is: word url1:count1,url2:count2;
                word, rest = line.split(" ", 1)
                rest = rest.rstrip(";")

                url_dict = {}
                if rest:
                    for entry in rest.split(","):
                        if ":" in entry:
                            url, count = entry.rsplit(":", 1)
                            try:
                                url_dict[url] = int(count)
                            except ValueError:
                                # Safely skip any broken splits caused by URLs containing commas
                                continue

                inverted_index[word] = url_dict
        print(f"Index loaded successfully! {len(inverted_index)} unique words ready.")
    except FileNotFoundError:
        print("Warning: my_index.txt not found. Run your index builder first.")


load_index()


@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    """
    Autocomplete endpoint.
    Takes the currently typed query, looks at the last word, and suggests completions.
    """
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])

    # Split the query to find the word currently being typed
    parts = query.split()
    if not parts:
        return jsonify([])

    prefix = parts[-1]
    base_query = " ".join(parts[:-1])
    base_query_with_space = base_query + " " if base_query else ""

    suggestions = []
    # Search the dictionary keys for words that start with the typed prefix
    for word in inverted_index.keys():
        if word.startswith(prefix):
            # Combine the previous words with the suggested word completion
            suggestions.append(base_query_with_space + word)
            if len(suggestions) >= 7:  # Limit to 7 autocomplete suggestions
                break

    return jsonify(suggestions)


@app.route('/search', methods=['GET'])
def search():
    """
    Multi-word search endpoint.
    Uses 'AND' logic: only returns URLs that contain ALL searched words.
    """
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])

    # 1. Clean and tokenize the user's query (supporting Arabic and English)
    words = re.findall(r'\b[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9]+\b', query)
    if not words:
        return jsonify([])

    result_urls = None

    # 2. Perform Multi-word Intersection (AND Logic)
    for word in words:
        if word in inverted_index:
            # Get all URLs containing this specific word
            urls_for_word = set(inverted_index[word].keys())

            if result_urls is None:
                result_urls = urls_for_word  # First word
            else:
                result_urls = result_urls.intersection(urls_for_word)  # Keep only matching URLs
        else:
            # If any word in the query doesn't exist in the index, return 0 results
            return jsonify([])

    if not result_urls:
        return jsonify([])

    # 3. Calculate "Relevance Score" by summing up word frequencies
    ranked_results = []
    for url in result_urls:
        # Sum the counts of all queried words for this specific URL
        score = sum(inverted_index[word][url] for word in words)
        ranked_results.append({"url": url, "score": score})

    # 4. Sort results from highest score to lowest
    ranked_results.sort(key=lambda x: x['score'], reverse=True)

    # Return the top 50 results to the React frontend
    return jsonify(ranked_results[:50])

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Accepts a WAV audio file from the browser and returns the transcribed text.
    Uses Python's SpeechRecognition library (Google HTTP REST API).
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        recognizer = sr.Recognizer()
        with sr.AudioFile(tmp_path) as source:
            audio_data = recognizer.record(source)

        text = recognizer.recognize_google(audio_data)
        return jsonify({'text': text})

    except sr.UnknownValueError:
        return jsonify({'error': 'Could not understand the audio. Please speak clearly.'}), 400
    except sr.RequestError as e:
        return jsonify({'error': f'Speech service error: {e}'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route('/view', methods=['GET'])
def view_page():
    """
    Proxy endpoint: fetches the target URL, rewrites its links,
    and injects mark.js to auto-highlight all searched words on load.
    """
    target_url = request.args.get('url', '')
    search_query = request.args.get('q', '')

    if not target_url:
        return Response('<h2>Missing url parameter</h2>', status=400, mimetype='text/html')

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        resp = requests.get(target_url, headers=headers, timeout=15, allow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        return Response(f'<h2>Could not fetch the page: {e}</h2>', status=502, mimetype='text/html')

    soup = BeautifulSoup(resp.content, 'lxml')
    base = target_url

    # Rewrite all relative URLs to absolute so images/css still load
    for tag, attr in [('a', 'href'), ('link', 'href'), ('script', 'src'),
                      ('img', 'src'), ('form', 'action')]:
        for el in soup.find_all(tag, **{attr: True}):
            val = el[attr]
            if val and not val.startswith(('http://', 'https://', '//', 'data:', 'javascript:')):
                el[attr] = urljoin(base, val)

    # Build the search words JS array
    words = [w for w in re.findall(r'[\w\u0600-\u06FF]+', search_query) if w]
    js_words = '[' + ','.join(f'"{w}"' for w in words) + ']'

    # Inject mark.js + auto-highlight script before </body>
    inject_script = soup.new_tag('script')
    inject_script['src'] = 'https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js'
    inject_style = soup.new_tag('style')
    inject_style.string = """
        mark {
            background: #FFD600 !important;
            color: #000 !important;
            padding: 0 2px;
            border-radius: 2px;
        }
        #highlight-banner {
            position: fixed; top: 0; left: 0; right: 0;
            background: #1a1a2e; color: #61dca3;
            font-family: monospace; font-size: 13px;
            padding: 6px 16px; z-index: 999999;
            display: flex; align-items: center; gap: 12px;
            border-bottom: 2px solid #61dca3;
        }
        #highlight-banner span { font-weight: bold; color: #FFD600; }
        body { padding-top: 38px !important; }
    """
    inline_script = soup.new_tag('script')
    inline_script.string = f"""
        (function() {{
            var words = {js_words};
            if (!words.length) return;

            // Add banner
            var banner = document.createElement('div');
            banner.id = 'highlight-banner';
            banner.innerHTML = '&#x1F50D; <strong>AERO Index</strong>: Highlighting &nbsp;' +
                words.map(function(w){{ return '<span>' + w + '</span>'; }}).join(' + ');
            document.body.insertBefore(banner, document.body.firstChild);

            // Highlight all occurrences
            var instance = new Mark(document.body);
            instance.mark(words, {{
                element: 'mark',
                className: '',
                separateWordSearch: true,
                acrossElements: true,
                iframes: false
            }});
        }})();
    """

    if soup.body:
        soup.body.append(inject_style)
        soup.body.append(inject_script)
        soup.body.append(inline_script)
    else:
        soup.append(inject_style)
        soup.append(inject_script)
        soup.append(inline_script)

    return Response(str(soup), status=200, mimetype='text/html')


if __name__ == '__main__':
    # Run the API on port 5000, but disable the reloader to prevent MemoryError from scanning scraped_pages/
    app.run(port=5000, debug=True, use_reloader=False)