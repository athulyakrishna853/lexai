from django.db import models
from django.contrib.auth.models import User

class LegalQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    DOMAIN_CHOICES = [
        ('criminal', 'Criminal Law'),
        ('civil', 'Civil Law'),
        ('labour', 'Labour Law'),
        ('family', 'Family Law'),
        ('consumer', 'Consumer Law'),
        ('cyber', 'Cyber Law'),
    ]

    query_text = models.TextField()
    ai_response = models.TextField(blank=True, null=True)
    legal_domain = models.CharField(
        max_length=50,
        choices=DOMAIN_CHOICES,
        blank=True,
        null=True
    )
    sections_cited = models.JSONField(blank=True, null=True)
    escalated_to_lawyer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Query: {self.query_text[:50]}"

    class Meta:
        ordering = ['-created_at']