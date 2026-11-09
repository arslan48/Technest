from django.db import models
from django.utils.functional import cached_property


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    objects = models.Manager()

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="products"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()

    @property
    def discount_percent(self):
        if self.compare_at_price is None or self.compare_at_price <= self.price:
            return None
        return max(
            1,
            round((self.compare_at_price - self.price) / self.compare_at_price * 100),
        )

    @cached_property
    def gallery_images(self):
        images = []
        if self.image:
            images.append(self.image.url)
        images.extend(
            image.image.url
            for image in self.images.all()
            if image.image
        )
        return images[:6]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/gallery/")
    alt_text = models.CharField(max_length=255, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    objects = models.Manager()

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return f"{self.product.name} image {self.position}"


class Announcement(models.Model):
    text = models.CharField(max_length=140)
    link_url = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    position = models.IntegerField(default=0)

    objects = models.Manager()

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return self.text
