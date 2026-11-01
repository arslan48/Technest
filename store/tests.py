from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from .models import Category, Product


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
