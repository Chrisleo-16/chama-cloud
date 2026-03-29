import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# The credentials we want to force
ADMIN_PHONE = '0711111111'
ADMIN_PASSWORD = 'password123'

print(f"Connecting to database to check for user: {ADMIN_PHONE}")

try:
    # Try to find the user
    user = User.objects.get(phone_number=ADMIN_PHONE)
    print(f"User {ADMIN_PHONE} already exists. Resetting password...")
    user.set_password(ADMIN_PASSWORD)
    # Ensure they have admin rights
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print("Password reset successful!")

except User.DoesNotExist:
    # Create the user if they don't exist
    print(f"User {ADMIN_PHONE} not found. Creating new superuser...")
    user = User.objects.create_superuser(
        phone_number=ADMIN_PHONE,
        password=ADMIN_PASSWORD
    )
    print("Superuser created successfully!")
except Exception as e:
    print(f"An error occurred: {str(e)}")

print("Done. You can now try logging in.")