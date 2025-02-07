# CommentRescueAI

CommentRescueAI automatically adds meaningful comments and docstrings to your Python code using AI, making your code more readable and maintainable.

![Version](https://img.shields.io/badge/version-0.0.3-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-^1.96.0-blue)

## Features

* AI-powered comment generation for Python code
* Automatic docstring creation for functions and classes
* Intelligent inline comments for complex code sections
* Local processing using Ollama
* Fully offline operation - no data leaves your system
* Lightweight model (Llama 3.2) that runs well on low-end devices
* Customizable settings through constants.ts

### Raw Code
```python
class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.price <= 0:
            raise ValidationError("Price must be greater than zero.")
```
### Docstring/Commented Code
```python
class Product(models.Model):
    """
    Represents a product in the catalog.

    Attributes:
        name (str): The name of the product.
        description (str): A brief description of the product.
        price (float): The price of the product.
        category (Category): The category this product belongs to.
        created_at (datetime): The timestamp when the product was created.
        updated_at (datetime): The timestamp when the product was last updated.

    Raises:
        ValidationError: If the price is not greater than zero.
    """

    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """
        Validates the product's price.

        Raises:
            ValidationError: If the price is not greater than zero.
        """
        # Check if the price is less than or equal to zero
        if self.price <= 0:
            raise ValidationError("Price must be greater than zero.")
```
## Performance

* Processing time: ~50-60 seconds for 100 lines of code on mid-range hardware (tested on AMD Ryzen 5600H with NVIDIA RTX 1650 4GB GPU)
* Runs in background: Feel free to switch to other windows while processing - the extension works asynchronously without blocking your workflow
* Resource-friendly: Uses Llama 3.2, optimized for running on consumer-grade hardware

## Requirements

* VS Code 1.96.0 or higher
* [Ollama](https://ollama.ai) installed on your system

## Setup

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Install this extension from VS Code Marketplace
3. Run the command `CommentRescueAI: Install Required Model` (This will download the necessary AI model)

## Using the Extension

1. Open a Python file
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. Type "Add AI comments" and select `CommentRescueAI: Add AI comments`
4. Continue working in other windows while the extension processes your code
5. You'll receive a notification when comments have been added

The extension will analyze your code and add appropriate comments and docstrings.

**⚠️ Important Note**: Due to using the lightweight Llama 3.2 3B model, occasionally you might see extra text before or after your code, such as:
```
"Here is the enhanced code with suitable inline comments and docstring added:"
[Your enhanced code]
"Let me know if you need any clarification..."
```
Simply remove these extra lines manually if they appear. We're working on fixing this rare issue in future updates.

## Extension Settings

You can customize the extension's behavior by modifying `constants.ts`:

* `BASE_URL`: Configure the Ollama API endpoint
* `MODEL_NAME`: Change the AI model being used
* `SYSTEM_PROMPT`: Customize the prompt that guides comment generation
* `MODEL_SIZE`: Specify the model size configuration
* `OLLAMA_GPU_OPTIONS`: Adjust GPU-related settings for Ollama

To modify settings:
1. Locate `constants.ts` in the extension's source code
2. Update the desired constants
3. Rebuild the extension

Example `constants.ts` configuration:
```typescript
export const BASE_URL = "http://localhost:11434";
export const MODEL_NAME = "llama3.2";
export const SYSTEM_PROMPT = "You are an expert programmer...";
```

## Known Issues

* Model installation might take several minutes depending on your internet connection
* Requires Ollama to be running in the background
* Comment generation takes ~1 minute per 100 lines of code - this is expected behavior due to local processing
* The model might occasionally include extra header/footer text around the enhanced code (manual removal required - fix in progress)

## Release Notes

### 0.0.1

Initial release of CommentRescueAI:
* Basic comment generation
* Docstring support
* Ollama integration
* Offline processing capability
* Background operation support
* Configurable settings through constants.ts

### 0.0.2
Fixed issue with Axios
* node_modules not getting published

### 0.0.3
Fixed issue with Output Channel
* changes: `exec` method to `spawn`

## For more information

* [Ollama Documentation](https://ollama.ai/docs)
* [File an Issue](https://github.com/username/commentrescueai/issues)

**Enjoy!**
