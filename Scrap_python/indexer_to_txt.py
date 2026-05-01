import requests
from bs4 import BeautifulSoup
import re
import os
import time

# Configuration
INPUT_FILE = "links.txt"
OUTPUT_FOLDER = "indexed_pages"
DELAY = 0.2  # Seconds to wait between requests to avoid being blocked


def sanitize_filename(url):
    """Converts a URL into a safe filename for Windows/Linux."""
    # Remove http://, https://, and replace symbols with underscores
    clean = re.sub(r'https?://', '', url)
    clean = re.sub(r'[\\/*?:"<>|.]', '_', clean)
    return clean[:150]  # Limit length for OS stability


def process_links():
    # 1. Create the output directory in your PyCharm project
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created folder: {OUTPUT_FOLDER}")

    # 2. Load the links
    try:
        with open(INPUT_FILE, "r") as f:
            urls = [line.strip() for line in f.readlines() if line.strip()]
    except FileNotFoundError:
        print(f"Error: {INPUT_FILE} not found. Please run your scraper first!")
        return

    print(f"Found {len(urls)} links. Starting individual indexing...")

    # 3. Iterate through links
    for i, url in enumerate(urls):
        try:
            # Add a small delay to be polite to servers
            time.sleep(DELAY)

            # Request the page content
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Remove non-text elements
                for element in soup(["script", "style", "nav", "footer"]):
                    element.extract()

                # Extract and clean words
                text = soup.get_text().lower()
                words = re.findall(r'\w+', text)
                unique_sorted_words = sorted(set(words))

                # Create the individual .txt file
                filename = f"{sanitize_filename(url)}.txt"
                file_path = os.path.join(OUTPUT_FOLDER, filename)

                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(f"SOURCE URL: {url}\n")
                    f.write("=" * 30 + "\n")
                    f.write("\n".join(unique_sorted_words))

                print(f"[{i + 1}/{len(urls)}] Successfully saved: {filename}")
            else:
                print(f"[{i + 1}] Failed: {url} (Status: {response.status_code})")

        except Exception as e:
            print(f"[{i + 1}] Error processing {url}: {e}")

    print("\nIndexing complete. Check the 'indexed_pages' folder.")


if __name__ == "__main__":
    process_links()