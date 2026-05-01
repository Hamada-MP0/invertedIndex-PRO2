import asyncio
import aiohttp
from bs4 import BeautifulSoup
from tqdm import tqdm
import os
import json

output_folder = "scraped_pages"
os.makedirs(output_folder, exist_ok=True)
semaphore = asyncio.Semaphore(50)

9
def clean_html(html_content):
    """Extract clean text from HTML by removing scripts and styles."""
    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove javascript and stylesheet tags
    for script_or_style in soup(['script', 'style', 'noscript', 'meta', 'header', 'footer']):
        script_or_style.extract()

    # Get text and clean whitespace
    text = soup.get_text(separator='\n')
    cleaned_lines = [line.strip() for line in text.splitlines() if line.strip()]
    return '\n'.join(cleaned_lines)


async def fetch(session, url, index):
    async with semaphore:
        try:
            async with session.get(url, timeout=20) as response:
                html_content = await response.text()
                content = clean_html(html_content)

                file_name = f"page_{index}.txt"
                file_path = os.path.join(output_folder, file_name)

                # Use asyncio.to_thread to prevent file I/O from blocking the async loop
                def write_file():
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(url + '\n')
                        f.write(content)

                await asyncio.to_thread(write_file)
                return {'url': url, 'status': 'saved', 'file': file_name}
        except Exception as e:
            return {'url': url, 'error': str(e)}


async def main():
    # Load and filter URLs
    if not os.path.exists('urls.txt'):
        print("urls.txt not found!")
        return

    with open('urls.txt', 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip()]

    results = []
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url, index) for index, url in enumerate(urls, start=1)]
        for future in tqdm(asyncio.as_completed(tasks), total=len(tasks)):
            result = await future
            results.append(result)

    with open('scrape_log.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    asyncio.run(main())