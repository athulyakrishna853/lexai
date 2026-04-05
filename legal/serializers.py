from rest_framework import serializers
from .models import LegalQuery

class LegalQuerySerializer(serializers.ModelSerializer):

    class Meta:
        model = LegalQuery
        fields = [
            'id',
            'query_text',
            'ai_response',
            'legal_domain',
            'sections_cited',
            'escalated_to_lawyer',
            'created_at',
        ]
        read_only_fields = ['ai_response', 'created_at']