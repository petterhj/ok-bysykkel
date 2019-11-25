# Imports
import logging
from requests import get
from flask import Flask, render_template, jsonify, request#, abort


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Constants
APP_IDENTIFIER = 'petterhj-okbysykkel'
GBFS_BASE_URL = 'https://gbfs.urbansharing.com/oslobysykkel.no/%s'


# App instance
app = Flask(__name__, **{
    'template_folder': 'templates',
    'static_folder': 'static',
})

@app.errorhandler(Exception)
def error_handler(error):
    ''' Catch-all error handler for external API requests.'''
    logger.error('Error occured during request')
    logger.exception(error)

    return jsonify({
        'success': False, 
        'message': 'Error occured during API request, endpoint="%s"' % (
            request.url_rule
        )
    })


# Route: Index
@app.route('/')
def index():
    '''Render base template.'''
    return render_template('index.html')


# JSON: Stations
@app.route('/json/stations')
def station_information():
    '''
    Returns list of stations. 
    Exceptions handled by flask error handler.
    '''
    
    logger.info('Requesting station information')

    r = get(**{
        'url': GBFS_BASE_URL % ('station_information.json'), 
        'headers': {'Client-Identifier': APP_IDENTIFIER}
    })

    logger.debug('> URL: %s' % (r.url))
    logger.debug('> Status code: %d' % (r.status_code))

    r.raise_for_status()

    stations = r.json()
    stations['data']['stations'] = sorted(stations['data']['stations'], key=lambda s: s['name'])
    stations['success'] = True

    return stations


# JSON: Stations
@app.route('/json/stations/status')
def station_status():
    '''
    Returns station status as dict with station ID as key. 
    Exceptions handled by flask error handler.
    '''

    logger.info('Requesting station status')

    r = get(**{
        'url': GBFS_BASE_URL % ('station_status.json'), 
        'headers': {'Client-Identifier': APP_IDENTIFIER}
    })

    logger.debug('> URL: %s' % (r.url))
    logger.debug('> Status code: %d' % (r.status_code))

    r.raise_for_status()

    status = r.json()
    status['success'] = True
    status['data']['stations'] = {
        str(s['station_id']): s for s in status['data']['stations']
    }

    return status


# Main
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)