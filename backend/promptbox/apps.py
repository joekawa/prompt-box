from django.apps import AppConfig


class PromptboxConfig(AppConfig):
    name = 'promptbox'

    def ready(self):
        import promptbox.signals
