//var config = require('../../server/config.json');
//var path = require('path');

module.exports = function(Customer) {
/*
  //send verification email after registration
  Customer.afterRemote('create', function(context, Customer, next) {
    console.log('> Customer.afterRemote triggered');

    var options = {
      type: 'email',
      to: Customer.email,
      from: 'noreply@receiptkeeper.com',
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../client/views/pages/register.html'),
      redirect: '/registered',
      user: Customer
    };

    Customer.verify(options, function(err, response) {
      if (err) return next(err);

      console.log('> verification email sent:', response);
      
      context.res.render('response', {
        title: 'Signed up successfully',
        content: 'Please check your email and click on the verification link before logging in.',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
	  console.log('>After verify: ');
    });
  });

  //send password reset link when requested
  Customer.on('resetPasswordRequest', function(info) {
    var url = 'http://' + config.host + ':' + config.port + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';

    Customer.app.models.Email.send({
      to: info.email,
      from: info.email,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });
*/  
};
