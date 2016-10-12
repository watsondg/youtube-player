'use strict';

var Emitter = require('tiny-emitter');

module.exports = Youtube;

function Youtube(el, opts) {
    opts = opts || {};
    this.options = {
        controls: opts.controls === true ? true : false,
        allowFullscreen: opts.allowFullscreen === true ? true : false,
        hasAutoplay: opts.hasAutoplay === true ? true : false,
        hasCueAutoplay: (opts.hasCueAutoplay || opts.hasAutoplay) === true ? true : false
    };
    this.el = el;

    this._isPopulated = false;
    this._hasPlayed = false;
    this._isPlaying = false;
    this.playbackInterval = -1;

    this.onPlayerPopulated = this.onPlayerPopulated.bind(this);
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackUpdate = this.onPlaybackUpdate.bind(this);
}

Youtube.prototype = Object.create(Emitter.prototype);
Youtube.prototype.constructor = Youtube;

Youtube.prototype.populatePlayer = function(videoId, startTime) {
    this.player = new YT.Player(this.el, {
        width: '100%',
        height: '100%',
        videoId: videoId,
        playerVars: {
            modestbranding: 1,
            rel: 0,
            controls: this.options.controls === true ? 1 : 0,
            showinfo: 0,
            allowfullscreen: this.options.allowFullscreen,
            autoplay: this.options.hasAutoplay === true ? 1 : 0,
            wmode: 'transparent',
            startSeconds: startTime,
            start: startTime
        },
        events :{
            onStateChange: this.onPlayerStateChange,
            onReady: this.onPlayerPopulated,
        }
    });
};

Youtube.prototype.cue = function(videoId, startTime) {
    startTime = startTime || 0;

    if (this._isPopulated && this.player) {
        if (this.options.hasAutoplay && !this._hasPlayed || this.options.hasCueAutoplay) {
            this.player.loadVideoById({
                videoId: videoId,
                startSeconds: startTime
            });
        } else {
            this.player.cueVideoById(videoId, startTime);
        }
    } else {
        this.populatePlayer(videoId, startTime);
    }
};

Youtube.prototype.onPlayerPopulated = function(event) {
    this.el = this.player.getIframe();
    this._isPopulated = true;
    this.emit('populated');
};

Youtube.prototype.onPlayerStateChange = function(state) {
    clearInterval(this.playbackInterval);
    var playerState = '';

    switch(state.data) {
        case YT.PlayerState.UNSTARTED:
            playerState = 'unstarted';
            break;

        case YT.PlayerState.ENDED:
            this.pause();
            this.player.seekTo(this.player.getDuration() - 0.1, false);
            setTimeout(this.pause.bind(this), 200);
            playerState = 'ended';
            break;

        case YT.PlayerState.PLAYING:
            this.playbackInterval = setInterval(this.onPlaybackUpdate, 100);
            this._isPlaying = true;
            this._hasPlayed = true;
            playerState = 'playing';
            break;

        case YT.PlayerState.ENDED:
        case YT.PlayerState.PAUSED:
            playerState = 'paused';
            this._isPlaying = false;
            break;

        case YT.PlayerState.BUFFERING:
            playerState = 'buffering';
            break;

        case YT.PlayerState.CUED:
            playerState = 'cued';
            break;
    }

    this.emit('statechange', playerState);
    this.emit(playerState);
};

Youtube.prototype.onPlaybackUpdate = function() {
    this.emit('timeupdate');
};

Youtube.prototype.fullscreen = function() {
    var el = this.el.parentNode || this.el;
    var requestFullScreen = el.requestFullScreen
        || el.mozRequestFullScreen
        || el.webkitRequestFullScreen
        || el.msRequestFullScreen;
    if (requestFullScreen) requestFullScreen.call(el);
};

Youtube.prototype.play = function() {
    if (!this._isPopulated) return;

    this.player.playVideo();
};

Youtube.prototype.pause = function() {
    if (!this._isPopulated) return;

    try {
        this.player.pauseVideo();
    } catch(e) {}
};

Youtube.prototype.seek = function(time) {
    if (!this._isPopulated) return;

    this.player.seekTo(time);
    this.player.playVideo();
};

Youtube.prototype.volume = function(value) {
    if (!this._isPopulated) return;

    this.player.setVolume(value * 100);
};

Youtube.prototype.mute = function() {
    if (!this._isPopulated) return;

    this.player.mute();
};

Youtube.prototype.unmute = function() {
    if (!this._isPopulated) return;

    this.player.unMute();
};

Youtube.prototype.isMuted = function() {
    if (!this._isPopulated) return false;

    return this.player.isMuted();
};

Youtube.prototype.getVolume = function() {
    if (!this._isPopulated) return 0;

    return this.player.getVolume();
};

Youtube.prototype.getDuration = function() {
    if (!this._isPopulated) return 0;

    return this.player.getDuration();
};

Youtube.prototype.isPopulated = function() {
    return this._isPopulated;
};

Youtube.prototype.isPlaying = function() {
    return this._isPlaying;
};

Youtube.prototype.hasPlayed = function() {
    return this._hasPlayed;
};

Youtube.prototype.getCurrentTime = function() {
    if (!this._isPopulated) return 0;

    return this.player.getCurrentTime();
};

Youtube.prototype.destroy = function() {
    this.pause();
    this.off();
    clearInterval(this.playbackInterval);
    this.el = null;
    if (this.player) this.player.destroy();
};