import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import { differenceWith, isEmpty } from 'lodash';

import resources from './locales/index.js';
import parser from './parser.js';
import render from './view.js';

const getProxyUrl = (url) => {
  const proxyUrl = new URL('/get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('url', url);
  proxyUrl.searchParams.set('disableCache', 'true');
  return proxyUrl.toString();
};

const updatePosts = (state) => {
  const { rssFeedUrls } = state;
  const promises = rssFeedUrls.map((url) => {
    console.log('feed url', url);
    const proxifyUrl = getProxyUrl(url);
    return axios.get(proxifyUrl)
      .then((response) => {
        const xml = response.data.contents;
        const { posts } = parser(xml);
        const uniquePosts = differenceWith(
          posts,
          state.uiState.posts,
          (newPost, oldPost) => newPost.title === oldPost.title,
        );
        console.log('uniquePost', uniquePosts);
        console.log(posts);
        if (!isEmpty(uniquePosts)) {
          state.uiState.posts.push(...uniquePosts);
        }
      });
  });
  console.log('updatePosts promises', promises);
  return Promise.all(promises);
};
const repeatupdatePosts = (state, delay = 5000) => {
  updatePosts(state)
    .then(() => setTimeout(repeatupdatePosts, delay, state));
};

const validateUrl = (url, urls, i18nextInstance) => {
  const shema = yup.string().trim()
    .required(i18nextInstance.t('form.empty'))
    .url(i18nextInstance.t('form.invalid'))
    .notOneOf(urls, i18nextInstance.t('form.exist'));
  return shema.validate(url);
};

export default () => {
  const elements = {
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
    feedForm: {
      form: document.querySelector('.rss-form'),
      urlInput: document.getElementById('url-input'),
      submitButton: document.querySelector('button[type="submit"]'),
    },
  };
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    urls: [],
    feeds: [],
    rssFeedUrls: [],
    errors: {},
    processState: '',
    form: {
      submitButtonState: false,
    },
    uiState: {
      feeds: [],
      posts: [],
      selectedPostId: null,
    },
  };
  const initRender = render(elements, state);
  const watchedState = onChange(state, (path, value, prevValue) => {
    console.log(path);
    // console.log(value);
    // render(elements)(path, value, prevValue);
    initRender(path, value, prevValue);
  });
  elements.feedForm.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const url = formData.get('url').trim();
    validateUrl(url, watchedState.rssFeedUrls, i18n)
      .then(() => {
        watchedState.errors = {};
        // watchedState.urls.push(url);
        watchedState.processState = 'loading';
        return axios.get(getProxyUrl(url));
      })
      .then((response) => {
        watchedState.processState = 'loaded';
        console.log('rssFeedurl ', url);
        const xml = response.data.contents;
        const { feeds, posts } = parser(xml);
        watchedState.rssFeedUrls.push(url);
        console.log(feeds);
        watchedState.uiState.feeds.push(...feeds);
        watchedState.uiState.posts.push(...posts);
        // console.log(state.feeds);
        watchedState.errors = {};
        // watchedState.feeds.push(url);
        // repeatupdatePosts(state);
      })
      .catch((e) => {
        // console.log(e.name);
        watchedState.processState = 'error';
        switch (e.name) {
          case 'ValidationError':
            watchedState.errors = e;
            watchedState.form.valid = false;
            break;
          case 'AxiosError':
            watchedState.errors = { message: i18n.t('networkError') };
            break;
          case 'ParserError':
            watchedState.errors = { message: 'RSS error' };
            break;
          default:
            throw new Error(`Unexpected error ${e.name}`);
        }
      })
      .finally(() => {
        repeatupdatePosts(watchedState);
      });
  });
};
