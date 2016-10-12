'use strict';


var test = require('tape');
var Youtube = require('../index.js');

var videoId = 'dQw4w9WgXcQ';
var videoId2 = 'PJ_GIRTTRaA';

var script = document.createElement('script');
script.src = 'https://www.youtube.com/player_api';
document.body.appendChild(script);

if (window.YT) {
    runTests();
} else {
    window.onYouTubeIframeAPIReady = function() {
        runTests();
    };
}

function runTests() {
    test('Youtube instance not ready test', function(assert) {
        var wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        var player = new Youtube(wrapper, {
            hasAutoplay: false,
            hasCueAutoplay: true
        });
        player.cue(videoId);
        player.play();
        var currentTime = player.getCurrentTime();
        setTimeout(function() {
            assert.pass('Player not ready shouldn\'t break');
            assert.deepEqual(currentTime, 0, 'Player time should be 0');
            player.destroy();
            wrapper.remove();
            assert.end();
        });
    });

    test('Youtube autoplay test', function(assert) {
        var wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        var player = new Youtube(wrapper, {
            hasAutoplay: false,
            hasCueAutoplay: true
        });
        player.cue(videoId);
        setTimeout(function() {
            player.once('playing', function() {
                assert.pass('cue autoplayed');
                player.destroy();
                wrapper.remove();
                assert.end();
            });
            player.cue(videoId2);
        }, 2500);
    });

    test('Youtube URL test', function(assert) {
        var wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        var player = new Youtube(wrapper, {
            hasAutoplay: true
        });
        player.once('playing', function() {
            assert.ok(player.player.getVideoUrl().indexOf('dQw4w9WgXcQ') > -1, 'URL should be loaded');
            player.destroy();
            wrapper.remove();
            assert.end();
        });
        player.cue(videoId);
    });

    test('currentTime should change during playback', function(assert) {
        var wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        var player = new Youtube(wrapper, {
            hasAutoplay: true
        });

        setTimeout(function() {
            player.once('timeupdate', function() {
                assert.ok(player.getCurrentTime() > 0, 'currentTime should have changed.');
                player.destroy();
                wrapper.remove();
                assert.end();
            });
        }, 1500);
        player.cue(videoId);
    });

    test('currentTime shouldn\'t change when playback is paused', function(assert) {
        var wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        var player = new Youtube(wrapper, {
            hasAutoplay: true
        });
        var time = 0;

        setTimeout(function() {
            player.once('timeupdate', function() {
                player.pause();
                setTimeout(function() {
                    time = player.getCurrentTime();

                    setTimeout(function() {
                        assert.ok(player.getCurrentTime() == time, 'currentTime should\'t have changed');
                        player.destroy();
                        wrapper.remove();
                        assert.end();
                    }, 500);
                }, 500);
            });
        }, 1500);
        player.cue(videoId);
    });
};