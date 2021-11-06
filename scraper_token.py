# importing the libraries
from bs4 import BeautifulSoup
import requests
import re
from getpass import getpass
import json
import datetime
import os
import argparse

#only for localhost
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

#CLI options
parser = argparse.ArgumentParser()
parser.add_argument('-c', dest="classification", help='Specifies the classification of source', required=True)
parser.add_argument('-o', dest="dbfile", help="Load a specific database in txt")
results = parser.parse_args()

#variables and utility
links = []
sourceLinks = []
classification = re.sub(r"(\w)([A-Z])", r"\1 \2", results.classification)
counter = 0

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
					counter+=1
					print("Found:", x, " ", counter, "/", len(links))

def lastDB():
	db = os.listdir('db/')
	if len(os.listdir('db/')) == 0:
    		print("No internal DB!")
	else:    
			lastdb = max(db)[12:-4]
			print("Lastest DB:",lastdb)

def saveLinks():
	nameDB = "db/sourceLinks_"+ datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")+"_"+classification.replace(" ", "_")+".txt"
	#remember: make db folder
	with open(nameDB, "w") as output:
    		output.write("\n".join(sourceLinks))

def getToken():
	print("I found", len(sourceLinks), "news source with classification", classification)
	print("For added to server please enter your username and password")
	print("Username:") 
	userName = input()
	pwd = getpass()
	payload = json.dumps({"username":userName, "password":pwd})
	request = json.loads(requests.post("https://localhost:5001/api/identity/login", data=payload, headers={"Content-Type": "application/json"}, verify=False).text)
	if 'token' in request:
	    token = request["token"]["token"]
	    print("Token Added!")
	    addSourceToServer(token)
	else:
	    print("Error! Try Again")
	    getToken()

def addSourceToServer(token):
	counter=0
	print("Start to adding on server...")
	for addedSource in sourceLinks:
		payload = json.dumps({"newsLink":addedSource, "classification":classification})
		request = requests.post("https://localhost:5001/api/news-source/add", data=payload, headers={"Content-Type": "application/json", "Authorization": "Bearer " + token}, verify=False)
		if request.status_code == 204:
			counter+=1
			print("Added on server:", addedSource, " ", counter, "/", len(sourceLinks))
		else:
			print("Error!", request.json())
	print("DONE! Added", counter, "source into your server!")

def openDB(db):
	with open(db, "r") as dbfile:
		for link in dbfile:
			sourceLinks.append(link.rstrip("\n"))

# start program
print("CriThink WebFactChecker Scraper v0.1")
print("------------------------------------")
print("Selected classification:", classification)
lastDB()
if results.dbfile:
	print("A external DB is selected")
	openDB(results.dbfile)
else:
	loadHTML()
saveLinks()
getToken()