from django.http import HttpResponse
from django.shortcuts import render


def say_hello(request):
	return render(request , 'index.html', {'name': 'Karlo,'})
def say_bye(request):
	return HttpResponse('Bye Bye')