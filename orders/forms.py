import re

from django import forms


class CheckoutForm(forms.Form):
    phone = forms.CharField(
        max_length=11,
        min_length=11,
        widget=forms.TextInput(
            attrs={
                "placeholder": "03001234567",
                "maxlength": "11",
                "inputmode": "numeric",
            }
        ),
        help_text="11 digits, for example 03001234567",
    )
    address = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}))

    def clean_phone(self):
        phone = self.cleaned_data["phone"].strip()

        if not re.fullmatch(r"\d{11}", phone):
            raise forms.ValidationError("Phone number must contain exactly 11 digits.")

        if not phone.startswith("03"):
            raise forms.ValidationError("Phone number must start with 03.")

        return phone