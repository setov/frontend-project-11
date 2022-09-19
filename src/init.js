import * as yup from 'yup';
import onChange from 'on-change';
import { isEmpty } from 'lodash';
import i18next from 'i18next';
import resources from './locales/index.js';

const rendeError = (elements, error, prevError) => {
  const formHadError = !isEmpty(prevError);
  const formHasError = !isEmpty(error);

  const formContainer = elements.feedForm.form.parentNode;
  const inputFormElement = elements.feedForm.urlInput;
  const { form } = elements.feedForm;
  if (!formHadError && !formHasError) {
    inputFormElement.focus();
    form.reset();
    return;
  }
  if (!formHasError) {
    inputFormElement.classList.remove('is-invalid');
    formContainer.lastChild.remove();
    inputFormElement.focus();
    form.reset();
    return;
  }

  if (formHadError) {
    inputFormElement.classList.remove('is-invalid');
    formContainer.lastChild.remove();
  }
  inputFormElement.classList.add('is-invalid');
  const errorElement = document.createElement('p');
  errorElement.classList.add('feedback', 'm-0', 'position-absolute', 'small', 'text-danger');
  errorElement.textContent = error.message;
  formContainer.appendChild(errorElement);
  inputFormElement.focus();
};

const render = (elements) => (path, value, prevValue) => {
  switch (path) {
    // case 'form.valid':
    //   elements.feedForm.submitButton.disabled = !value;
    //   break;
    case 'form.errors':
      rendeError(elements, value, prevValue);
      break;
    default:
      break;
  }
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
    form: {
      valid: true,
      processState: 'filling',
      processError: null,
      errors: {},
    },
  };
  const initRender = render(elements);
  const watchedState = onChange(state, (path, value, prevValue) => {
    // console.log(state.form.errors.type);
    // console.log(path);
    // console.log(value);
    // render(elements)(path, value, prevValue);
    initRender(path, value, prevValue);
  });
  elements.feedForm.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const url = formData.get('url').trim();
    validateUrl(url, watchedState.urls, i18n)
      .then(() => {
        watchedState.form.errors = {};
        watchedState.urls.push(url);
        watchedState.form.valid = true;
      })
      .catch((e) => {
        watchedState.form.errors = e;
        watchedState.form.valid = false;
      });
  });
};
