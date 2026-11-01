from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from store.models import Category, Product

from .models import Cart, CartItem, Order


class CartAndCheckoutTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='buyer', password='Test@12345')
        self.other_user = User.objects.create_user(username='other', password='Test@12345')
        category = Category.objects.create(name='Chargers')
        self.product = Product.objects.create(
            category=category,
            name='Fast Charger',
            price=Decimal('1500.00'),
            stock=5,
        )
        self.client.login(username='buyer', password='Test@12345')

    def test_cart_requires_login(self):
        self.client.logout()
        response = self.client.get(reverse('cart_detail'))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse('login'), response.url)

    def test_add_to_cart_creates_item(self):
        self.client.post(reverse('add_to_cart', args=[self.product.id]))
        self.assertEqual(CartItem.objects.count(), 1)  # ty: ignore[unresolved-attribute]
        self.assertEqual(CartItem.objects.first().quantity, 1)  # ty: ignore[unresolved-attribute]

    def test_adding_same_product_twice_increases_quantity(self):
        url = reverse('add_to_cart', args=[self.product.id])
        self.client.post(url)
        self.client.post(url)
        self.assertEqual(CartItem.objects.count(), 1)  # ty: ignore[unresolved-attribute]
        self.assertEqual(CartItem.objects.first().quantity, 2)  # ty: ignore[unresolved-attribute]

    def test_cannot_add_out_of_stock_product(self):
        self.product.stock = 0
        self.product.save()
        self.client.post(reverse('add_to_cart', args=[self.product.id]))
        self.assertEqual(CartItem.objects.count(), 0)  # ty: ignore[unresolved-attribute]

    def test_checkout_creates_order_and_reduces_stock(self):
        cart = Cart.objects.create(user=self.user)  # ty: ignore[unresolved-attribute]
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)  # ty: ignore[unresolved-attribute]

        response = self.client.post(
            reverse('checkout'),
            {'phone': '03001234567', 'address': 'Test address'},
        )

        self.assertRedirects(response, reverse('order_history'))
        order = Order.objects.get()  # ty: ignore[unresolved-attribute]
        self.assertEqual(order.total, Decimal('3000.00'))
        self.assertEqual(order.status, 'Pending')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(cart.items.count(), 0)

    def test_checkout_rejects_invalid_phone(self):
        cart = Cart.objects.create(user=self.user)  # ty: ignore[unresolved-attribute]
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)  # ty: ignore[unresolved-attribute]

        self.client.post(
            reverse('checkout'),
            {'phone': '45678', 'address': 'Test address'},
        )

        self.assertEqual(Order.objects.count(), 0)  # ty: ignore[unresolved-attribute]
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_checkout_fails_when_stock_is_insufficient(self):
        cart = Cart.objects.create(user=self.user)  # ty: ignore[unresolved-attribute]
        CartItem.objects.create(cart=cart, product=self.product, quantity=3)  # ty: ignore[unresolved-attribute]
        self.product.stock = 1
        self.product.save()

        self.client.post(
            reverse('checkout'),
            {'phone': '03001234567', 'address': 'Test address'},
        )

        self.assertEqual(Order.objects.count(), 0)  # ty: ignore[unresolved-attribute]
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 1)

    def test_user_cannot_see_other_users_orders(self):
        Order.objects.create(  # ty: ignore[unresolved-attribute]
            user=self.other_user,
            phone='03001234567',
            address='Somewhere',
            total=Decimal('100.00'),
        )
        response = self.client.get(reverse('order_history'))
        self.assertEqual(len(response.context['orders']), 0)
