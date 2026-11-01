from django.shortcuts import get_object_or_404, render

from .models import Category, Product


def home(request):
    products = Product.objects.all()
    categories = Category.objects.all()

    query = request.GET.get('q', '')
    selected_category = request.GET.get('category', '')

    if query:
        products = products.filter(name__icontains=query)

    if selected_category:
        products = products.filter(category_id=selected_category)

    context = {
        'products': products,
        'categories': categories,
        'query': query,
        'selected_category': selected_category,
    }
    return render(request, 'store/index.html', context)


def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    return render(request, 'store/product_detail.html', {'product': product})
