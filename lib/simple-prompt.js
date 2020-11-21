'use strict;'

const prompts = require('prompts');

module.exports = async (question) => {
  const response = await prompts({
    type: 'text',
    name: 'answer',
    message: question
  });
  return response.answer;
}