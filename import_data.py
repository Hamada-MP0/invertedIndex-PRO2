import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aero_backend.settings')
django.setup()

from search_api.models import IndexEntry
from django.db import transaction


def run_import():
    print("Clearing old database...")
    IndexEntry.objects.all().delete()

    print("Starting Highly Optimized Import...")

    BATCH_SIZE = 100
    entries = []
    count = 0

    with open("my_index.txt", "r", encoding="utf-8") as f:
        # Wrap the whole process in a transaction for speed and safety
        with transaction.atomic():
            for line in f:
                space_index = line.find(" ")

                if space_index == -1:
                    continue

                word = line[:space_index].strip()
                posting_list = line[space_index + 1:].strip().rstrip(";")

                if not word or not posting_list:
                    continue

                entries.append(IndexEntry(word=word, posting_list=posting_list))
                count += 1

                if len(entries) >= BATCH_SIZE:
                    IndexEntry.objects.bulk_create(entries)
                    print(f"Imported {count} words...")
                    entries = []  # Clear memory immediately

            # Save any remaining entries at the very end
            if entries:
                IndexEntry.objects.bulk_create(entries)
                print(f"Imported {count} words...")

    print("🎉 Import Complete! Your database is ready.")


if __name__ == '__main__':
    run_import()