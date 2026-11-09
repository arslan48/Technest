from django.contrib import admin

from .models import Announcement, Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name", "category", "price", "compare_at_price", "discount_percent", "stock"
    )
    list_filter = ("category",)
    search_fields = ("name",)
    inlines = (ProductImageInline,)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("text", "link_url", "is_active", "position")
    list_editable = ("is_active", "position")
