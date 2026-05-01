from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import IndexEntry, SearchHistory
import re
import os
import tempfile
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import speech_recognition as sr

# --- 1. HISTORY VIEW ---
def get_history(request):
    """Returns the 10 most recent unique search queries."""
    history = SearchHistory.objects.values_list('query', flat=True).distinct()[:10]
    return JsonResponse(list(history), safe=False)

# --- 2. AUTOCOMPLETE VIEW ---
def autocomplete(request):
    query = request.GET.get('q', '').lower()
    if not query: return JsonResponse([], safe=False)

    parts = query.split()
    if not parts: return JsonResponse([], safe=False)

    prefix = parts[-1]
    base_query = " ".join(parts[:-1])
    base_query_with_space = base_query + " " if base_query else ""

    matches = IndexEntry.objects.filter(word__startswith=prefix)[:7]
    suggestions = [base_query_with_space + match.word for match in matches]

    return JsonResponse(suggestions, safe=False)

# --- 3. MAIN SEARCH VIEW ---
def search(request):
    query = request.GET.get('q', '').lower()
    if not query: return JsonResponse([], safe=False)

    # Save to history ONLY if query is not empty
    SearchHistory.objects.create(query=query)

    words = re.findall(r'\b[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9]+\b', query)
    if not words: return JsonResponse([], safe=False)

    db_entries = IndexEntry.objects.filter(word__in=words)

    if len(db_entries) != len(words):
        return JsonResponse([], safe=False)

    parsed_entries = []
    for entry in db_entries:
        url_dict = {}
        for item in entry.posting_list.split(','):
            if ':' in item:
                url, count = item.rsplit(':', 1)
                try:
                    url_dict[url] = int(count)
                except ValueError:
                    continue
        parsed_entries.append(url_dict)

    result_urls = None
    for url_dict in parsed_entries:
        urls_for_word = set(url_dict.keys())
        if result_urls is None:
            result_urls = urls_for_word
        else:
            result_urls = result_urls.intersection(urls_for_word)

    if not result_urls: return JsonResponse([], safe=False)

    ranked_results = []
    for url in result_urls:
        score = sum(url_dict[url] for url_dict in parsed_entries)
        ranked_results.append({"url": url, "score": score})

    ranked_results.sort(key=lambda x: x['score'], reverse=True)
    return JsonResponse(ranked_results[:50], safe=False)

# --- 4. VOICE TRANSCRIBE VIEW ---
@csrf_exempt
def transcribe(request):
    if request.method == 'POST':
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return JsonResponse({'error': 'No audio file provided'}, status=400)

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                for chunk in audio_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            recognizer = sr.Recognizer()
            with sr.AudioFile(tmp_path) as source:
                audio_data = recognizer.record(source)

            text = recognizer.recognize_google(audio_data)
            return JsonResponse({'text': text})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
    return JsonResponse({'error': 'Invalid request'}, status=400)

# --- 5. PAGE VIEWER (HIGHLIGHTER) ---
def view_page(request):
    target_url = request.GET.get('url', '')
    search_query = request.GET.get('q', '')

    if not target_url:
        return HttpResponse('<h2>Missing url parameter</h2>', status=400)

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        resp = requests.get(target_url, headers=headers, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return HttpResponse(f'<h2>Could not fetch the page: {e}</h2>', status=502)

    soup = BeautifulSoup(resp.content, 'lxml')
    base = target_url

    for tag, attr in [('a', 'href'), ('link', 'href'), ('script', 'src'), ('img', 'src')]:
        for el in soup.find_all(tag, **{attr: True}):
            val = el[attr]
            if val and not val.startswith(('http://', 'https://', '//', 'data:', 'javascript:')):
                el[attr] = urljoin(base, val)

    words = [w for w in re.findall(r'[\w\u0600-\u06FF]+', search_query) if w]
    js_words = '[' + ','.join(f'"{w}"' for w in words) + ']'

    inject_script = soup.new_tag('script', src='https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js')
    inject_style = soup.new_tag('style')
    inject_style.string = "mark { background: #FFD600 !important; color: #000 !important; } body { padding-top: 38px !important; }"
    inline_script = soup.new_tag('script')
    inline_script.string = f"(function() {{ var w={js_words}; if(!w.length) return; var m=new Mark(document.body); m.mark(w,{{element:'mark',separateWordSearch:true,acrossElements:true}}); }})();"

    if soup.body:
        soup.body.extend([inject_style, inject_script, inline_script])
    else:
        soup.extend([inject_style, inject_script, inline_script])

    return HttpResponse(str(soup), content_type='text/html')