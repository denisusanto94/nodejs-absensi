const geolib = require('geolib');

const isWithinRange = (lat1, lon1, lat2, lon2, radius) => {
    return geolib.isPointWithinRadius(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 },
        radius
    );
};

const getDistance = (lat1, lon1, lat2, lon2) => {
    return geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
    );
};

module.exports = { isWithinRange, getDistance };
