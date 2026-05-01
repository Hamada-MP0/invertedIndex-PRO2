from django.contrib import admin
from django.urls import path
from search_api import views # Import your new views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('autocomplete', views.autocomplete, name='autocomplete'),
    path('search', views.search, name='search'),
    path('transcribe', views.transcribe, name='transcribe'),
    path('view', views.view_page, name='view'),
    path('history', views.get_history, name='history'),
]