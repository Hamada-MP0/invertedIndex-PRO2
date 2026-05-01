import os
import glob
import re
from collections import defaultdict

ARABIC_STOPWORDS = {
    'في', 'من', 'على', 'إلى', 'عن', 'أن', 'إن', 'لا', 'ما', 'لم', 'لن',
    'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت', 'أنتم', 'إنكم', 'هذا',
    'هذه', 'ذلك', 'تلك', 'كان', 'كانت', 'يكون', 'يمكن', 'قد', 'كل', 'مع'
}

ENGLISH_STOPWORDS = {'a', 'the', 'and', 'is', 'in', 'it', 'to', 'of', 'for', 'on', 'with', 'this', 'that'}
STOPWORDS = ARABIC_STOPWORDS.union(ENGLISH_STOPWORDS)


def preprocess_text(text):
    text = text.lower()
    words = re.findall(r'\b[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9]+\b', text)
    return [word for word in words if word not in STOPWORDS]


def read_files_lazily(folder_path):
    """Generator that yields (url, content) to save memory."""
    file_paths = glob.glob(os.path.join(folder_path, "*.txt"))
    for file_path in file_paths:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                url = file.readline().strip()  # First line is URL
                content = file.read()  # Rest is content
                if url and content:
                    yield url, content
        except Exception as e:
            print(f"Error reading {file_path}: {e}")


def build_inverted_index(folder_path):
    inverted_index = defaultdict(dict)

    for url, content in read_files_lazily(folder_path):
        words = preprocess_text(content)
        word_counts = {}

        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1

        for word, count in word_counts.items():
            inverted_index[word][url] = count

    return inverted_index


def save_inverted_index(inverted_index, output_file=None):
    """Writes line by line to avoid memory overflow on giant dictionaries."""
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            for word in sorted(inverted_index.keys()):
                url_counts = inverted_index[word]
                url_count_strs = [f"{url}:{count}" for url, count in url_counts.items()]
                f.write(f"{word} {','.join(url_count_strs)};\n")
        print(f"Inverted index written to {output_file}")
    else:
        for word in sorted(inverted_index.keys()):
            url_counts = inverted_index[word]
            url_count_strs = [f"{url}:{count}" for url, count in url_counts.items()]
            print(f"{word} {','.join(url_count_strs)};")


def main(folder_path, output_file=None):
    if not os.path.exists(folder_path):
        print(f"Folder not found: {folder_path}")
        return

    print("Building inverted index... This may take a while.")
    inverted_index = build_inverted_index(folder_path)
    print(f"Indexed {len(inverted_index)} unique words.")

    save_inverted_index(inverted_index, output_file)