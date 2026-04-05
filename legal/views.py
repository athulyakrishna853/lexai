 
# from rest_framework import status
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from .models import LegalQuery
# from .serializers import LegalQuerySerializer
# from groq import Groq
# from dotenv import load_dotenv
# import os

# load_dotenv()


# @api_view(['GET', 'POST'])
# def legal_query_list(request):

#     if request.method == 'GET':
#         queries = LegalQuery.objects.all()
#         serializer = LegalQuerySerializer(queries, many=True)
#         return Response(serializer.data)

#     if request.method == 'POST':
#         serializer = LegalQuerySerializer(data=request.data)
#         if serializer.is_valid():
#             query_obj = serializer.save()

#             try:
#                 client = Groq(api_key=os.getenv(""))
#                 domain = query_obj.legal_domain or "general"
#                 chat_completion = client.chat.completions.create(
#                     model="llama-3.3-70b-versatile",
#                     messages=[
#                         {
#                             "role": "system",
#                             "content": f"You are LexAI, an AI legal assistant specialising in {domain} law in India. Answer clearly and concisely in plain language. Cite relevant sections or acts where applicable."
#                         },
#                         {
#                             "role": "user",
#                             "content": query_obj.query_text
#                         }
#                     ]
#                 )
#                 query_obj.ai_response = chat_completion.choices[0].message.content
#                 query_obj.save()

#             except Exception as e:
#                 query_obj.ai_response = f"AI error: {str(e)}"
#                 query_obj.save()

#             updated_serializer = LegalQuerySerializer(query_obj)
#             return Response(updated_serializer.data, status=status.HTTP_201_CREATED)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['GET', 'DELETE'])
# def legal_query_detail(request, pk):
#     try:
#         query = LegalQuery.objects.get(pk=pk)
#     except LegalQuery.DoesNotExist:
#         return Response({'error': 'Query not found'}, status=status.HTTP_404_NOT_FOUND)

#     if request.method == 'GET':
#         serializer = LegalQuerySerializer(query)
#         return Response(serializer.data)

#     if request.method == 'DELETE':
#         query.delete()
#         return Response({'message': 'Query deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import LegalQuery
from .serializers import LegalQuerySerializer
from groq import Groq
from dotenv import load_dotenv
import os
import PyPDF2

# Load environment variables
load_dotenv()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    if User.objects.filter(email=data.get('email')).exists():
        return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create(
            username=data['email'], # Use email as username
            email=data['email'],
            password=make_password(data['password']),
            first_name=data.get('name', '')
        )
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def legal_query_list(request):

    if request.method == 'GET':
        queries = LegalQuery.objects.filter(user=request.user)
        serializer = LegalQuerySerializer(queries, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = LegalQuerySerializer(data=request.data)
        if serializer.is_valid():
            query_obj = serializer.save(user=request.user)

            try:
                # ✅ Correct API key usage
                api_key = os.getenv("GROQ_API_KEY")
                if not api_key:
                    raise ValueError("GROQ_API_KEY environment variable is not set")
                client = Groq(api_key=api_key)

                domain = query_obj.legal_domain or "general"

                chat_completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": f"""
You are LexAI, an AI legal assistant specialising in {domain} law in India.

Return your response in this exact structured format using Markdown. The descriptions must be in simple, non-legal language.

**Problem Summary:**
(Briefly summarize the user's issue)

**Applicable Laws:**
(List the applicable Indian laws in simple terms)

**Sections Involved:**
(List the specific sections from IPC, BNS, IT Act, etc., and append a simulated search link as: [Indian Kanoon: Section X](https://indiankanoon.org/search/?formInput=Section+X+of+IPC))

**Your Rights:**
(Explain the user's rights clearly and calmly)

**What You Should Do Next:**
(Provide step-by-step practical actions)

**Disclaimer:**
Not a substitute for a lawyer. This is AI-generated guidance.
"""
                        },
                        {
                            "role": "user",
                            "content": query_obj.query_text
                        }
                    ]
                )

                # ✅ Safe response handling
                if chat_completion.choices:
                    query_obj.ai_response = chat_completion.choices[0].message.content
                else:
                    query_obj.ai_response = "No response generated."

                query_obj.save()

            except Exception as e:
                query_obj.ai_response = f"AI error: {str(e)}"
                query_obj.save()

            updated_serializer = LegalQuerySerializer(query_obj)
            return Response(updated_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def legal_query_detail(request, pk):
    try:
        query = LegalQuery.objects.get(pk=pk, user=request.user)
    except LegalQuery.DoesNotExist:
        return Response({'error': 'Query not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = LegalQuerySerializer(query)
        return Response(serializer.data)

    if request.method == 'DELETE':
        query.delete()
        return Response({'message': 'Query deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_document(request):
    file = request.FILES.get('document')
    if not file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'File size exceeds 5MB limit'}, status=status.HTTP_400_BAD_REQUEST)
        
    extracted_text = ""
    filename = file.name.lower()
    
    try:
        if filename.endswith('.txt'):
            extracted_text = file.read().decode('utf-8')
        elif filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(file)
            extracted_text = ""
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        else:
             return Response({'error': 'Unsupported file type. Please upload a .txt or .pdf file.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Failed to process file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
    if not extracted_text.strip():
        return Response({'error': 'Could not extract any text from the document.'}, status=status.HTTP_400_BAD_REQUEST)

    # truncate safely for model context limits
    extracted_text = extracted_text[:15000]

    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        client = Groq(api_key=api_key)

        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """
You are LexAI, an AI legal assistant in India.

Analyze the provided document text and return your response in this exact structured format using Markdown. Use simple language.

**Document Summary:**
(Briefly summarize the document)

**Key Points / Clauses:**
(Highlight details, requirements, or obligations)

**Legal Meaning:**
(Explain the significance under Indian law simply)

**Risks / Red Flags:**
(Highlight risks or unfair terms, use a warning tone if necessary)

**What You Should Do Next:**
(Provide step-by-step practical actions)

**Disclaimer:**
Not a substitute for a lawyer. This is AI-generated guidance.
"""
                },
                {
                    "role": "user",
                    "content": f"Document content:\n\n{extracted_text}"
                }
            ]
        )

        ai_response = chat_completion.choices[0].message.content if chat_completion.choices else "No response generated."

        query_obj = LegalQuery.objects.create(
            user=request.user,
            query_text=f"[Document Upload] {file.name}",
            ai_response=ai_response
        )
        
        serializer = LegalQuerySerializer(query_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': f'AI error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)