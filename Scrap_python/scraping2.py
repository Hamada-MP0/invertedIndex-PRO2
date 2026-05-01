import requests
from bs4 import BeautifulSoup
from collections import deque
from urllib.parse import urljoin, urlparse
import time


def start_discovery():
    print("--- Discovery Setup ---")
    user_input = input("Enter starting URL(s) separated by commas: ")
    seeds = [s.strip() for s in user_input.split(',')]

    limit = int(input("How many links do you want to collect? (e.g. 30000): "))
    stay_on_domain = input("Stay on the same domain only? (yes/no): ").lower() == 'yes'

    visited = set()
    to_visit = deque(seeds)
    original_domain = urlparse(seeds[0]).netloc

    print(f"\n--- Starting Discovery on {original_domain} ---")

    # REAL HUMAN HEADERS (Crucial for GeeksforGeeks)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
    }

    with open('urls.txt', 'w', encoding='utf-8') as f:
        while to_visit and len(visited) < limit:
            url = to_visit.popleft()

            if url in visited:
                continue

            try:
                # Politeness delay so they don't ban your IP
                time.sleep(0.1)

                res = requests.get(url, timeout=10, headers=headers)

                if res.status_code != 200:
                    print(f"Failed: {url} (Status Code: {res.status_code})")
                    continue

                soup = BeautifulSoup(res.text, 'lxml')
                visited.add(url)

                for link in soup.find_all('a', href=True):
                    full_url = urljoin(url, link['href']).split('#')[0].rstrip('/')
                    parsed = urlparse(full_url)

                    if parsed.scheme in ['http', 'https']:
                        is_same_domain = parsed.netloc == original_domain

                        if stay_on_domain and not is_same_domain:
                            continue

                        if full_url not in visited and full_url not in to_visit:
                            to_visit.append(full_url)
                            f.write(full_url + '\n')

                if len(visited) % 10 == 0:
                    f.flush()
                    print(f"Progress: {len(visited)} / {limit} links collected...")

            except Exception as e:
                print(f"Error visiting {url}: {e}")

    print(f"\nSuccess! {len(visited)} links saved to urls.txt")


if __name__ == "__main__":
    start_discovery()