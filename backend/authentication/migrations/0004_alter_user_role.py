# Generated by Django 5.1.7 on 2025-03-20 10:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_alter_user_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('warehouse_admin', 'Warehouse Admin'), ('warehouse_staff', 'Warehouse Staff'), ('manager', 'Manager'), ('employee', 'Employee'), ('engineering', 'Engineering'), ('operations_maintenance', 'Operations Maintenance'), ('budget_analyst', 'Budget Analyst')], default='employee', max_length=50),
        ),
    ]
