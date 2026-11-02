import csv
from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from store.models import Category, Product


class Command(BaseCommand):
    help = "Import products from a CSV file. Images are read from a folder."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", help="Path to the CSV file")
        parser.add_argument(
            "--images",
            default="import_data/images",
            help="Folder that contains the image files",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"])
        images_dir = Path(options["images"])

        if not csv_path.exists():
            raise CommandError(f"CSV file not found: {csv_path}")

        created_count = 0
        updated_count = 0

        with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
            for row in csv.DictReader(csv_file):
                category, _ = Category.objects.get_or_create(
                    name=row["category"].strip()
                )
                product, was_created = Product.objects.update_or_create(
                    name=row["name"].strip(),
                    defaults={
                        "category": category,
                        "description": row.get("description", "").strip(),
                        "price": Decimal(row["price"].strip()),
                        "stock": int(row["stock"].strip()),
                    },
                )

                image_name = row.get("image", "").strip()
                if image_name and not product.image:
                    image_path = images_dir / image_name
                    if image_path.exists():
                        with image_path.open("rb") as image_file:
                            product.image.save(
                                image_name, File(image_file), save=True
                            )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f"Image not found: {image_path}")
                        )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created_count}, updated: {updated_count}"
            )
        )
