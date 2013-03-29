tau.mashups
 .addDependency('libs/jquery/jquery')
 .addMashup(function ($, config) {
	$(document).ready(function() {
		$('div.rankBar[title*="Spent:"]').each(function() { $(this).removeClass('rankBar');
			var info = $(this).attr('title').match(/.*\s(\d+\sh).*\s(\d+\sh)/);
			$(this).html(info[1]+' / '+info[2]);
		});
	});
  });