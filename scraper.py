# importing the libraries
from bs4 import BeautifulSoup
import requests
import re
import json
import datetime
import os
import argparse

# only for localhost
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# CLI options
parser = argparse.ArgumentParser()
parser.add_argument('-c', dest="classification",
                    help='Specifies the classification of source', required=True)
parser.add_argument('-o', dest="dbfile",
                    help="Load a specific database in txt")
results = parser.parse_args()

#variables and utility
links = []
sourceLinks = []
classification = re.sub(r"(\w)([A-Z])", r"\1 \2", results.classification)
counter = 0
log = []

urlPattern = re.compile(r"Source:")


def loadHTML():
    with open('bias.html', 'r') as f:
        content = f.read()
        soup = BeautifulSoup(content, 'lxml')
        for tag in soup.find_all('td'):
            for anchor in tag.find_all('a'):
                links.append(anchor['href'])
        for firstUrl in links:
            txtUrl = requests.get(firstUrl).text
            urlSoup = BeautifulSoup(txtUrl, 'lxml')
            for elm in urlSoup.find_all("p"):
                if urlPattern.search(elm.text):
                    x = urlPattern.sub('', elm.text)
                    sourceLinks.append(x)
                    global counter
                    counter += 1
                    print(str(counter) + "/" +
                          str(len(links)) + " [FOUND] " + x)


def lastDB():
    db = os.listdir('db/')
    if len(os.listdir('db/')) == 0:
        print("No internal DB!")
    else:
        lastdb = max(db)[12:-4]
        print("Lastest DB:", lastdb)


def saveLinks():
    nameDB = "db/sourceLinks_" + datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S") + \
        "_"+classification.replace(" ", "_")+".txt"
    # remember: make db folder
    with open(nameDB, "w") as output:
        output.write("\n".join(sourceLinks))


def addSourceToServer():
    counter = 0
    print("Start to adding on server...")
    for addedSource in sourceLinks:
        payload = json.dumps(
            {"newsLink": addedSource, "classification": classification})
        request = requests.post("https://crithinkapp.com/api/admin/news-source-add", data=payload, headers={
                                "Content-Type": "application/json", "X-CriThink-Cross-Service": "scraper"}, verify=False)
        if request.status_code == 204:
            counter += 1
            goodLog = str(counter) + "/" + \
                str(len(sourceLinks)) + " [OK] " + addedSource
            print(goodLog)
            log.append(goodLog)
        else:
            badLog = str(counter) + "/" + str(len(sourceLinks)) + \
                " [ERROR] " + addedSource + " [TYPE] " + str(request.json())
            print(badLog)
            log.append(badLog)
    print("DONE! Added", counter, classification, "source into your server!")
    if counter < len(sourceLinks):
        print("WARNING: Some links are missing please check the log!")


def openDB(db):
    with open(db, "r") as dbfile:
        for link in dbfile:
            sourceLinks.append(link.rstrip("\n"))


def makeLog():
    logName = "log/log_"+datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S") + \
        "_"+classification+".txt"
    # remember: make log folder
    with open(logName, "w") as output:
        output.write("\n".join(log))


# start program
print("CriThink WebFactChecker Scraper v0.1.3")
print("------------------------------------")
print("Selected classification:", classification)
lastDB()
if results.dbfile:
    print("A external DB is selected")
    openDB(results.dbfile)
else:
    loadHTML()
saveLinks()
addSourceToServer()
makeLog()
