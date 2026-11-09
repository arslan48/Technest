from django.conf import settings

from .models import Announcement


def site_context(request):
    return {
        "APP_VERSION": settings.APP_VERSION,
        "announcements": Announcement.objects.filter(is_active=True)[:6],
    }
