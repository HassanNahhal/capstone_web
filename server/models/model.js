module.exports = function(MyModel) {
  // send an email
  MyModel.sendEmail = function(cb) {
    MyModel.app.models.Email.send({
      to: 'cch.choi@gmail.com',
      from: 'cch.choi@gmail.com',
      subject: 'Confirmation email',
      text: 'This is for testing',
      html: 'my <em>html</em>'
    }, function(err, mail) {
      console.log('email sent!');
      cb(err);
    });
  }
};