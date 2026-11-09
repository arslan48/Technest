from decimal import Decimal
import csv
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from .context_processors import site_context
from .models import Announcement, Category, Product, ProductImage


class StoreViewTests(TestCase):
    def setUp(self):
        self.chargers = Category.objects.create(name='Chargers')
        self.earbuds = Category.objects.create(name='Earbuds')
        self.charger = Product.objects.create(
            category=self.chargers, name='Fast Charger',
            price=Decimal('1500.00'), stock=10,
        )
        self.earbud = Product.objects.create(
            category=self.earbuds, name='Wireless Earbuds',
            price=Decimal('3500.00'), stock=5,
        )

    def test_home_page_lists_products(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['products']), 2)

    def test_search_filters_products(self):
        response = self.client.get(reverse('home'), {'q': 'charger'})
        self.assertEqual(list(response.context['products']), [self.charger])

    def test_category_filter(self):
        response = self.client.get(reverse('home'), {'category': self.earbuds.id})
        self.assertEqual(list(response.context['products']), [self.earbud])

    def test_missing_product_returns_404(self):
        response = self.client.get(reverse('product_detail', args=[999]))
        self.assertEqual(response.status_code, 404)

    def test_gallery_images_lists_main_first_and_limits_to_six(self):
        self.charger.image.name = "products/main.jpg"
        self.charger.save()
        for position in range(7):
            ProductImage.objects.create(
                product=self.charger,
                image=f"products/gallery/{position}.jpg",
                position=position,
            )
        self.assertEqual(
            self.charger.gallery_images,
            [
                "/media/products/main.jpg",
                *[f"/media/products/gallery/{position}.jpg" for position in range(5)],
            ],
        )

    def test_discount_percent_only_when_compare_price_is_higher(self):
        self.charger.compare_at_price = Decimal("2000.00")
        self.assertEqual(self.charger.discount_percent, 25)
        self.charger.compare_at_price = self.charger.price
        self.assertIsNone(self.charger.discount_percent)
        self.charger.compare_at_price = Decimal("1000.00")
        self.assertIsNone(self.charger.discount_percent)
        self.charger.compare_at_price = None
        self.assertIsNone(self.charger.discount_percent)

    def test_announcement_context_is_active_and_ordered(self):
        Announcement.objects.create(text="Later", position=2)
        Announcement.objects.create(text="Inactive", position=0, is_active=False)
        Announcement.objects.create(text="First", position=1)
        announcements = site_context(None)["announcements"]
        self.assertEqual([item.text for item in announcements], ["First", "Later"])

    def test_home_page_contains_active_announcement(self):
        Announcement.objects.create(text="Free delivery this week")
        response = self.client.get(reverse("home"))
        self.assertContains(response, "Free delivery this week")

    def test_import_command_updates_compare_price_and_imports_gallery_without_duplicates(self):
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            images_dir = root / "images"
            images_dir.mkdir()
            (images_dir / "side.jpg").write_bytes(b"image-bytes")
            csv_path = root / "products.csv"
            with csv_path.open("w", newline="", encoding="utf-8") as file:
                writer = csv.DictWriter(
                    file,
                    fieldnames=["category", "name", "description", "price", "stock", "compare_at_price", "gallery"],
                )
                writer.writeheader()
                writer.writerow({
                    "category": "Chargers",
                    "name": "Imported Charger",
                    "description": "",
                    "price": "1200.00",
                    "stock": "4",
                    "compare_at_price": "1500.00",
                    "gallery": "side.jpg|missing.jpg",
                })
            with override_settings(MEDIA_ROOT=root / "media"):
                call_command("import_products", str(csv_path), images=str(images_dir), verbosity=0)
                call_command("import_products", str(csv_path), images=str(images_dir), verbosity=0)
            imported = Product.objects.get(name="Imported Charger")
            self.assertEqual(imported.compare_at_price, Decimal("1500.00"))
            self.assertEqual(imported.images.count(), 1)
