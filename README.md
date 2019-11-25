# ok-bysykkel

Simple Flask/Vue based application listing and displaying all public bikeshare stations in a map. Data provided by [Oslo Bysykkel](https://oslobysykkel.no/). Automatically updates station status every 15 seconds.


### Requirements (server)
* [Python 3](https://www.python.org/downloads/)
	* [Flask](https://pypi.org/project/flask/)
	* [Requests](https://pypi.org/project/requests/)

`pip install flask requests`
or
`pip install -r requirements.txt`


### Run
Binds to localhost:5000 (with debug enabled) by default.

`python3 app.py`


### Screenshot
![ok-bysykkel](https://raw.githubusercontent.com/petterhj/ok-bysykkel/master/screenshot2.png "ok-bysykkel")