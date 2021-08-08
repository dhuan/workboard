def is_text(value):
    return isinstance(value, str) and len(value.strip()) > 1

def is_number(value):
    return isinstance(value, int)
