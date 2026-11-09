import csv
from decimal import Decimal
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from store.models import Category, Product, ProductImage


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
                        "compare_at_price": (
                            Decimal(row["compare_at_price"].strip())
                            if row.get("compare_at_price", "").strip()
                            else None
                        ),
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

                gallery_names = row.get("gallery", "").strip()
                for position, gallery_name in enumerate(
                    (name.strip() for name in gallery_names.split("|") if name.strip()),
                    start=0,
                ):
                    gallery_path = images_dir / gallery_name
                    if not gallery_path.is_file():
                        self.stdout.write(
                            self.style.WARNING(f"Image not found: {gallery_path}")
                        )
                        continue
                    if product.images.filter(image__endswith=gallery_name).exists():
                        continue
                    with gallery_path.open("rb") as image_file:
                        ProductImage.objects.create(
                            product=product,
                            image=File(image_file, name=gallery_name),
                            position=position,
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
