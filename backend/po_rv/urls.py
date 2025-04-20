from django.urls import path
from .views import CreateDraftPOView, FinalizePOView, SaveDraftPOView
from . import views

urlpatterns = [
    path('draft-po/create/<int:pk>/', CreateDraftPOView.as_view(), name='create-draft-po'),
    path("preview/<int:pk>/", views.POPreviewView.as_view(), name="po-preview"),
    path('po/finalize/<int:pk>/', FinalizePOView.as_view(), name='finalize-po'),
    path('po/save-draft/<int:pk>/', SaveDraftPOView.as_view(), name='save-draft-po'),

]
