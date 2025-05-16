from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that uses 'size' parameter instead of 'page_size'
    """
    page_size_query_param = 'size'
    max_page_size = 1000
    
    def get_paginated_response(self, data):
        """
        Return a paginated response with additional metadata like total pages
        """
        count = self.page.paginator.count
        total_pages = (count + self.page_size - 1) // self.page_size if count > 0 else 0
        
        return Response({
            'count': count,
            'total_pages': total_pages,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        }) 