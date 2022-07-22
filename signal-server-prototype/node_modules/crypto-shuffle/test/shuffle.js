var shuffle = require('../');
var expect = require('chai').expect;

describe('Shuffle', function() {
    var deck = [
        'AS', 'KS', 'QS', 'JS', 'TS', '9S', '8S', '7S', '6S', '5S', '4S', '3S', '2S',
        'AH', 'KH', 'QH', 'JH', 'TH', '9H', '8H', '7H', '6H', '5H', '4H', '3H', '2H',        
        'AD', 'KD', 'QD', 'JD', 'TD', '9D', '8D', '7D', '6D', '5D', '4D', '3D', '2D',
        'AC', 'KC', 'QC', 'JC', 'TC', '9C', '8C', '7C', '6C', '5C', '4C', '3C', '2C'
    ];
    
    it('is exported', function() {
        expect(shuffle).to.be.a('function');        
    });

    it('mutates the array', function() {
        var cards = deck.slice(0);
        shuffle(cards);
        expect(cards).to.not.eql(deck);
    });

    it('is fluent', function() {
        var cards = deck.slice(0);
        var deal = shuffle(cards);
        expect(deal).to.have.lengthOf(cards.length);
        expect(deal).to.eql(cards);
    });
    
    it('randomly swaps', function() {
        var cards = deck.slice(0);
        shuffle(cards);
        
        expect(cards).to.have.lengthOf(deck.length);
        for (var i = 0; i < deck.length; ++i) {
            expect(cards).to.include(deck[i]);
        }
    });
    
});
