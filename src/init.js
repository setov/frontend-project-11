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
        if (!isEmpty(uniquePosts)) {
          state.uiState.posts.unshift(...uniquePosts);
        }
      });
  });
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
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalFooter: document.querySelector('.modal-footer'),
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
      selectedPostIds: [],
    },
  };
  const view = render(elements, state, i18n);
  const watchedState = onChange(state, (path, value, prevValue) => {
    view(path, value, prevValue);
  });
  elements.feedForm.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const url = formData.get('url').trim();
    validateUrl(url, watchedState.rssFeedUrls, i18n)
      .then(() => {
        watchedState.errors = {};
        watchedState.processState = 'loading';
        return axios.get(getProxyUrl(url));
      })
      .then((response) => {
        watchedState.processState = 'loaded';
        const xml = response.data.contents;
        const { feeds, posts } = parser(xml);
        watchedState.rssFeedUrls.push(url);
        watchedState.uiState.feeds.unshift(...feeds);
        watchedState.uiState.posts.unshift(...posts);
        watchedState.errors = {};
        repeatupdatePosts(watchedState);
      })
      .catch((e) => {
        watchedState.processState = 'error';
        switch (e.name) {
          case 'ValidationError':
            watchedState.errors = e;
            watchedState.form.valid = false;
            break;
          case 'AxiosError':
            watchedState.errors = { message: i18n.t('errors.networkError') };
            break;
          case 'ParserError':
            watchedState.errors = { message: i18n.t('errors.rssError') };
            break;
          default:
            throw new Error(`Unexpected error ${e.name}`);
        }
      });
  });
  elements.postsContainer.addEventListener('click', (evt) => {
    const selectedPostId = evt.target.dataset.id;
    watchedState.uiState.selectedPostId = selectedPostId;
    watchedState.uiState.selectedPostIds.push(selectedPostId);
  });
};
