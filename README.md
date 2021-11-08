# News Sources Scraper
Script to scrape website in order to get news source categories

## Supported sites
- [Media Bias/Fact Checker](https://mediabiasfactcheck.com/)

## Requirements
- Python3
- Pip
- [Beautiful Soup](https://pypi.org/project/beautifulsoup4/)

## Usage

### Local File
It is possible to upload sources from a local text file 
```shell
python scraper.py -c <classification type> -o <file>.txt
```
Each link must be formatted with the new line
```
source1.com
source2.com
source3.com
...
```



### Media Bias / Fact Checker
1. Go to the [search page](https://mediabiasfactcheck.com/filtered-search/) on the site and select the type of bias

2. Save **the complete HTML page** with specific name **bias.html** to the root directory

3. Run the script

```shell
python scraper.py -c <classification type>
```