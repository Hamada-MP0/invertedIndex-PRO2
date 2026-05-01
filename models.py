from django.db import models

class IndexEntry(models.Model):
    """
    Stores the inverted index entries.
    'db_index=True' makes searching for specific words blazingly fast.
    """
    word = models.CharField(max_length=255, unique=True, db_index=True)
    # Stores the "url1:count,url2:count" string
    posting_list = models.TextField()

    def __str__(self):
        return self.word

class SearchHistory(models.Model):
    """
    Stores the history of search queries.
    """
    query = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']  # Show newest searches first

    def __str__(self):
        return f"{self.query} at {self.timestamp}"