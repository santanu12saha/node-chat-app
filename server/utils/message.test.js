const expect = require('expect');
const { generateMessage, generateLocationMessage } = require('./message');

describe('generateMessage', () => {
    it('should generate correct message object', () => {
        var from = 'Tapasmita', 
        text = 'Some message';
        var message = generateMessage(from, text);

        expect(message.createdAt).toBeA('number');
        expect(message).toInclude({from, text});
    });
});

describe('generateLocationMessage', () => {
    it('should generate correct location object', () => {
        var from = 'Deb', 
        latitude = 15,
        logitude = 19,
        url = 'https://www.google.com/maps?q=15,19';

        var message = generateLocationMessage(from, latitude, logitude);
        expect(message.createdAt).toBeA('number');
        expect(message).toInclude({from, url});

    });
});