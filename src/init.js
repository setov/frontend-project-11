import * as yup from 'yup';
import onChange from 'on-change';
import { isEmpty } from 'lodash';

const rendeError = (elements, error, prevError) => {
  const formHadError = !isEmpty(prevError);
  const formHasError = !isEmpty(error);

  const formContainer = elements.feedForm.form.parentNode;
  const inputFormElement = elements.feedForm.urlInput;
  const { form } = elements.feedForm;
  if (!formHadError && !formHasError) {
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

  const errorMessage = error.type === 'url' ? 'Ссылка должна быть валидным URL' : 'RSS уже существует';
  inputFormElement.classList.add('is-invalid');
  const errorElement = document.createElement('p');
  errorElement.classList.add('feedback', 'm-0', 'position-absolute', 'small', 'text-danger');
  errorElement.textContent = errorMessage;
  formContainer.appendChild(errorElement);
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

const validateUrl = (url, urls) => {
  const shema = yup.string().trim().required().url()
    .notOneOf(urls);
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

  const state = {
    urls: [],
    form: {
      valid: true,
      processState: 'filling',
      processError: null,
      errors: {},
    },
  };
  const watchedState = onChange(state, (path, value, prevValue) => {
    // console.log(state.form.errors);
    // console.log(path);
    // console.log(value);
    render(elements)(path, value, prevValue);
  });
  elements.feedForm.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const url = formData.get('url');
    validateUrl(url, watchedState.urls)
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
