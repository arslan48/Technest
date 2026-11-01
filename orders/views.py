from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from store.models import Product

from .forms import CheckoutForm
from .models import Cart, CartItem, Order, OrderItem


def get_user_cart(user):
    cart, created = Cart.objects.get_or_create(user=user)
    return cart


@login_required
def cart_detail(request):
    cart = get_user_cart(request.user)
    return render(request, 'orders/cart.html', {'cart': cart})


@login_required
@require_POST
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if product.stock < 1:
        messages.error(request, 'This product is out of stock.')
        return redirect('product_detail', product_id=product.id)

    cart = get_user_cart(request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)

    if not created:
        if item.quantity < product.stock:
            item.quantity += 1
            item.save()
        else:
            messages.error(request, f'Only {product.stock} in stock.')

    return redirect('cart_detail')


@login_required
@require_POST
def update_cart(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)

    try:
        quantity = int(request.POST.get('quantity', 1))
    except ValueError:
        quantity = 1

    if quantity < 1:
        item.delete()
    elif quantity > item.product.stock:
        messages.error(request, f'Only {item.product.stock} in stock.')
    else:
        item.quantity = quantity
        item.save()

    return redirect('cart_detail')


@login_required
@require_POST
def remove_from_cart(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    item.delete()
    return redirect('cart_detail')


@login_required
def checkout(request):
    cart = get_user_cart(request.user)
    cart_items = list(cart.items.select_related('product'))

    if not cart_items:
        messages.error(request, 'Your cart is empty.')
        return redirect('cart_detail')

    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        if form.is_valid():
            try:
                with transaction.atomic():
                    order = Order.objects.create(
                        user=request.user,
                        phone=form.cleaned_data['phone'],
                        address=form.cleaned_data['address'],
                        total=0,
                    )

                    total = 0
                    for item in cart_items:
                        product = Product.objects.select_for_update().get(
                            id=item.product_id
                        )

                        if item.quantity > product.stock:
                            raise ValueError(
                                f'Not enough stock for {product.name}. '
                                f'Only {product.stock} left.'
                            )

                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=item.quantity,
                            price=product.price,
                        )
                        product.stock -= item.quantity
                        product.save()
                        total += product.price * item.quantity

                    order.total = total
                    order.save()
                    cart.items.all().delete()
            except ValueError as error:
                messages.error(request, str(error))
                return redirect('cart_detail')

            messages.success(request, f'Order #{order.id} placed successfully.')
            return redirect('order_history')
    else:
        form = CheckoutForm()

    context = {'cart': cart, 'cart_items': cart_items, 'form': form}
    return render(request, 'orders/checkout.html', context)


@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user).prefetch_related('items__product')
    return render(request, 'orders/order_history.html', {'orders': orders})
