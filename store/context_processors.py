from django.conf import settings

from .models import Announcement, Category


def site_context(request):
    return {
        "APP_VERSION": settings.APP_VERSION,
        "announcements": Announcement.objects.filter(is_active=True)[:6],
        "search_categories": Category.objects.all(),
        "search_query": request.GET.get("q", ""),
        "search_category": request.GET.get("category", ""),
    }
