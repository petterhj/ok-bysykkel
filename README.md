# ok-bysykkel

Simple Flask/Vue based application listing all public bikeshare stations provided by [Oslo Bysykkel](https://oslobysykkel.no/). Automatically updates station status every 15 seconds.

Most obvious improvement potential: Sortable list (including by distance), refresh by returned ttl value and support for older browsers.


### Requirements
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
![ok-bysykkel](https://raw.githubusercontent.com/petterhj/ok-bysykkel/master/screenshot.png "ok-bysykkel")