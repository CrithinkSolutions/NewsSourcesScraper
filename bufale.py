from bs4 import BeautifulSoup
import requests
import json
import unicodedata

links = []


def main():
    config = json.load(open('config.json'))['bufale']
    bufalePage = requests.get(config['url'])
    soup = BeautifulSoup(bufalePage.content, 'lxml')
    pageContent = soup.find('div', {'class': 'page-content'})
    for descriptionOfLinks in pageContent.find_all('h3'):
        # Normalized Title, thanks to https://stackoverflow.com/a/34669482
        title = unicodedata.normalize('NFKD', descriptionOfLinks.text)
        listOfLinks = descriptionOfLinks.find_next('ul')
        for link in listOfLinks.find_all('a'):
            links.append(
                {'url': link['href'], 'classification': config['classification'][title]})
    open('bufale.json', 'w').write(json.dumps(links))


main()
