/**
 * English copy for lower-level domain helpers that can reach a person.
 *
 * The helpers in this catalogue do not own a React translation hook, so they
 * resolve these complete templates through the typed catalogue. Machine
 * statuses, provider responses, logs, and user-entered content stay outside
 * this module.
 */
export const fullDomainFeedbackEnNZ = {
  'domain.error.network':
    'Connection issue detected. Please check your internet connection and try again.',
  'domain.error.authentication':
    'Authentication required. Please log in to continue.',
  'domain.error.permission':
    'Permission needed to continue. Please grant the required permissions.',
  'domain.error.validation': 'Please check your input and try again.',
  'domain.error.camera':
    'Camera issue detected. Please ensure camera permissions are granted and try again.',
  'domain.error.upload':
    'Upload failed. Please check your connection and try again.',
  'domain.error.submission':
    'Submission failed. Please try submitting your proof again.',
  'domain.error.review':
    'Review action failed. Please try again or contact support.',
  'domain.error.database': 'Data sync issue. Please try again in a moment.',
  'domain.error.challenge':
    'Challenge state error. Please refresh and try again.',
  'domain.error.group': 'Group action failed. Please try again.',
  'domain.error.unknown': 'Something went wrong. Please try again.',
  'domain.error.title.network': 'Connection Error',
  'domain.error.title.authentication': 'Authentication Required',
  'domain.error.title.permission': 'Permission Needed',
  'domain.error.title.validation': 'Invalid Input',
  'domain.error.title.camera': 'Camera Error',
  'domain.error.title.upload': 'Upload Failed',
  'domain.error.title.submission': 'Submission Failed',
  'domain.error.title.review': 'Review Error',
  'domain.error.title.database': 'Sync Error',
  'domain.error.title.challenge': 'Challenge Error',
  'domain.error.title.group': 'Group Error',
  'domain.error.title.unknown': 'Error',
  'domain.error.connection_tips': 'Connection Tips',
  'domain.error.connection_tips_body':
    'Try switching between WiFi and mobile data, or move to an area with better signal.',
  'domain.error.camera_permissions': 'Camera Permissions',
  'domain.error.camera_permissions_body':
    'Make sure Menta has camera access in your device settings.',
  'domain.action.try_again': 'Try Again',
  'domain.action.check_connection': 'Check Connection',
  'domain.action.log_in': 'Log In',
  'domain.action.grant_permissions': 'Grant Permissions',
  'domain.action.open_settings': 'Open Settings',
  'domain.action.check_permissions': 'Check Permissions',
  'domain.action.save_draft': 'Save Draft',
  'domain.action.retry_submission': 'Retry Submission',
  'domain.action.save_for_later': 'Save for Later',

  'domain.challenge.proof_default.fitness.photo':
    'Take a photo during or after your workout that shows what you did.',
  'domain.challenge.proof_default.fitness.video':
    'Record a short clip of the workout you completed.',
  'domain.challenge.proof_default.fitness.text':
    'Write what exercise you did and for how long.',
  'domain.challenge.proof_default.fitness.none':
    'Mark the workout complete after you finish it. No upload is required.',
  'domain.challenge.proof_default.mindfulness.photo':
    'Take a photo of the place or setup you used for the practice.',
  'domain.challenge.proof_default.mindfulness.video':
    'Record a short reflection about the practice you completed.',
  'domain.challenge.proof_default.mindfulness.text':
    'Write what practice you did and for how long.',
  'domain.challenge.proof_default.mindfulness.none':
    'Mark the practice complete after you finish it. No upload is required.',
  'domain.challenge.proof_default.learning.photo':
    'Take a photo of the notes, book, or work you completed.',
  'domain.challenge.proof_default.learning.video':
    'Record a short clip explaining what you learned.',
  'domain.challenge.proof_default.learning.text':
    'Write what you studied and one thing you learned.',
  'domain.challenge.proof_default.learning.none':
    'Mark the study session complete after you finish it. No upload is required.',
  'domain.challenge.proof_default.productivity.photo':
    'Take a photo of the finished work or completed task list.',
  'domain.challenge.proof_default.productivity.video':
    'Record a short clip showing the work you completed.',
  'domain.challenge.proof_default.productivity.text':
    'Write which tasks you completed.',
  'domain.challenge.proof_default.productivity.none':
    'Mark the tasks complete after you finish them. No upload is required.',
  'domain.challenge.proof_default.health.photo':
    'Take a photo that shows the healthy choice you made.',
  'domain.challenge.proof_default.health.video':
    'Record a short clip describing the healthy choice you made.',
  'domain.challenge.proof_default.health.text':
    'Write what healthy choice you made today.',
  'domain.challenge.proof_default.health.none':
    'Mark the healthy choice complete after you make it. No upload is required.',
  'domain.challenge.proof_default.creativity.photo':
    'Take a photo of what you made or the process you used.',
  'domain.challenge.proof_default.creativity.video':
    'Record a short clip of your process or finished work.',
  'domain.challenge.proof_default.creativity.text':
    'Write what you made and how you worked on it.',
  'domain.challenge.proof_default.creativity.none':
    'Mark the creative work complete after you finish it. No upload is required.',
  'domain.challenge.proof_default.social.photo':
    'With permission, take a photo from the time you spent together.',
  'domain.challenge.proof_default.social.video':
    'Record a short private reflection about the time you spent together.',
  'domain.challenge.proof_default.social.text':
    'Write who you spent time with and what you did together.',
  'domain.challenge.proof_default.social.none':
    'Mark the social promise complete after you do it. No upload is required.',
  'domain.challenge.proof_default.fallback.photo':
    "Take a photo that shows today's promise was completed.",
  'domain.challenge.proof_default.fallback.video':
    "Record a short clip that shows today's promise was completed.",
  'domain.challenge.proof_default.fallback.text':
    'Write what you completed today.',
  'domain.challenge.proof_default.fallback.none':
    "Mark today's promise complete after you do it. No upload is required.",

  'domain.auth.user_not_authenticated': 'User not authenticated',
  'domain.auth.session_validation_failed': 'Session validation failed',
  'domain.auth.no_valid_session': 'No valid session found',
  'domain.auth.user_id_mismatch': 'User ID mismatch',
  'domain.auth.validation_failed': 'Authentication validation failed',
  'domain.auth.authentication_required': 'Authentication required',
  'domain.monitoring.login_again': 'Please log in again to continue',
  'domain.monitoring.more_momenta':
    'You need more Momenta to complete this action',
  'domain.monitoring.network':
    'Network error. Please check your connection and try again',
  'domain.monitoring.duration_range': 'Duration must be between 1 and 365 days',
  'domain.monitoring.name_range': 'Name must be between 3 and 50 characters',
  'domain.monitoring.invalid_values':
    'One or more values do not meet requirements. Please check your inputs.',
  'domain.monitoring.group_name_exists':
    'A group with this name already exists. Please choose a different name.',
  'domain.monitoring.invite_code_exists':
    'Invite code already in use. Please try again.',
  'domain.monitoring.already_exists':
    'This already exists. Try a different value.',
  'domain.monitoring.referenced_item_missing':
    'Referenced item no longer exists. Please refresh and try again.',
  'domain.monitoring.required_missing':
    'Required information is missing. Please fill in all fields.',
  'domain.monitoring.access_denied':
    'You do not have access to perform this action.',
  'domain.monitoring.permission_denied':
    "You don't have permission to perform this action",
  'domain.monitoring.rate_limited':
    "You're doing that too quickly. Please wait a moment and try again.",
  'domain.monitoring.usage_limit':
    "You've reached your usage limit. Upgrade to Pro for more promises and groups, plus monthly Momenta.",
  'domain.monitoring.generic': 'Something went wrong. Please try again',

  'domain.network.no_connection':
    'No internet connection. Please check your network and try again.',
  'domain.network.request_timed_out': 'Request timed out. Please try again.',
  'domain.network.error':
    'Network error occurred. Please check your connection.',
  'domain.network.try_later': 'Network error. Please try again later.',
  'domain.network.service_unavailable':
    'Service is temporarily unavailable. Please try again shortly.',
  'domain.network.unknown_error': 'Unknown error',
  'domain.network.generic_error': 'An error occurred. Please try again.',

  'domain.oauth.offline': "You're offline. Reconnect and try again.",
  'domain.oauth.google_unavailable':
    "Sign in with Google isn't available in this version of Menta. Use email instead.",
  'domain.oauth.google_finish': "Google sign-in couldn't finish. Try again.",
  'domain.oauth.apple_unavailable':
    "Sign in with Apple isn't available on this device. Use email instead.",
  'domain.oauth.apple_finish': "Apple sign-in couldn't finish. Try again.",
  'domain.oauth.google_cancelled': 'Sign-in was cancelled',
  'domain.oauth.apple_cancelled': 'Sign-in was cancelled',
  'domain.oauth.google_failed':
    "Couldn't sign in with Google. Try again or use email.",
  'domain.oauth.google_already_open': 'Google sign-in is already open.',
  'domain.oauth.google_device_unavailable':
    "Google sign-in isn't available on this device. Use email instead.",
  'domain.oauth.google_open':
    "Google sign-in couldn't open. Try again or use email.",
  'domain.oauth.google_not_finished':
    "Google sign-in didn't finish. Return to Menta and try again.",
  'domain.oauth.google_unsafe':
    "Google sign-in couldn't finish safely. Start it again from Menta.",
  'domain.oauth.google_unauthorised':
    "Google sign-in wasn't authorised. Try again or use email.",
  'domain.oauth.google_return':
    "Google sign-in couldn't finish. Try again or use email.",
  'domain.oauth.apple_open':
    "Apple sign-in couldn't open. Try again or use email.",
  'domain.oauth.apple_not_finished':
    "Apple sign-in didn't finish. Return to Menta and try again.",
  'domain.oauth.apple_unsafe':
    "Apple sign-in couldn't finish safely. Start it again from Menta.",
  'domain.oauth.apple_unauthorised':
    "Apple sign-in wasn't authorised. Try again or use email.",
  'domain.oauth.apple_return':
    "Apple sign-in couldn't finish. Try again or use email.",

  'domain.edge.failed':
    'Something went wrong with {functionName}. Please try again.',
  'domain.edge.maintenance_failed':
    'Maintenance operation failed. Please contact support if this persists.',
  'domain.edge.user_failed':
    'Unable to {displayName}. Please check your connection and try again.',

  'domain.events.saved_photo_unavailable':
    'The saved photo is no longer available on this device.',
  'domain.events.saved_photo_changed':
    'The saved photo changed before it could be uploaded.',
  'domain.events.photo_arrival_unknown':
    "We couldn't tell whether the photo arrived. Check this photo before sending another one.",
  'domain.events.photo_status_updating':
    'The photo was sent, but its event status is still updating.',
  'domain.events.date_format':
    'Use YYYY-MM-DD for the date and 24-hour HH:MM for the time.',
  'domain.events.invalid_date_time': 'Choose a valid local date and time.',
  'domain.events.future_start': 'Choose a start time in the future.',
  'domain.eventStore.publishing_account_changed':
    'You changed accounts while Menta was publishing. Sign back in to the original account and check this same event.',
  'domain.eventStore.event_other_account':
    'This event belongs to another signed-in account. Sign in as the organiser before publishing.',
  'domain.eventStore.photo_other_account':
    'This saved event photo belongs to another signed-in account.',
  'domain.eventStore.checking_saved_photo':
    'You changed accounts while Menta was checking the saved event photo.',
  'domain.eventStore.prepare_photo_account_changed':
    'You changed accounts before Menta could prepare the event photo.',
  'domain.eventStore.send_photo_account_changed':
    'You changed accounts before Menta could send the event photo.',
  'domain.eventStore.checking_photo_arrival':
    'You changed accounts while Menta was checking whether the photo arrived.',
  'domain.eventStore.photo_status_updating':
    'You changed accounts while the event photo status was updating.',
  'domain.eventStore.event_open_account_changed':
    'You changed accounts while the event was opening. Try again.',
  'domain.eventStore.event_load_account_changed':
    'You changed accounts while the event was loading. Try again.',
  'domain.eventStore.details_open_account_changed':
    'You changed accounts while the event details were opening. Try again.',
  'domain.eventStore.details_load_account_changed':
    'You changed accounts while the event details were loading. Try again.',
  'domain.eventStore.album_open_account_changed':
    'You changed accounts while the attendee album was opening. Try again.',
  'domain.eventStore.sign_in_album': 'Sign in to open the attendee album.',
  'domain.eventStore.album_load_account_changed':
    'You changed accounts while the attendee album was loading. Try again.',
  'domain.eventStore.review_open_account_changed':
    'You changed accounts while the organiser review was opening. Try again.',
  'domain.eventStore.sign_in_review': 'Sign in to review attendee photos.',
  'domain.eventStore.review_load_account_changed':
    'You changed accounts while the organiser review was loading. Try again.',
  'domain.eventStore.recap_open_account_changed':
    'You changed accounts while the event recap was opening. Try again.',
  'domain.eventStore.sign_in_recap': 'Sign in to open the event recap.',
  'domain.eventStore.recap_load_account_changed':
    'You changed accounts while the event recap was loading. Try again.',
  'domain.eventStore.join_start_account_changed':
    'You changed accounts before joining started. Try again.',
  'domain.eventStore.join_save_account_changed':
    'You changed accounts while Menta was saving your place. Sign back in and check attendance.',
  'domain.eventStore.leave_start_account_changed':
    'You changed accounts before leaving started. Try again.',
  'domain.eventStore.leave_update_account_changed':
    'You changed accounts while Menta was updating your place. Sign back in and check attendance.',
  'domain.eventStore.checkin_start_account_changed':
    'You changed accounts before check-in started. Try again.',
  'domain.eventStore.checkin_finish_account_changed':
    'You changed accounts while check-in was finishing. Sign back in and check attendance.',
  'domain.eventStore.photo_send_start_account_changed':
    'You changed accounts before the event photo was sent. Try again.',
  'domain.eventStore.sign_in_send_photo':
    'Sign in before sending an event photo.',
  'domain.eventStore.photo_status_check_account_changed':
    'You changed accounts while the event photo status was updating. Sign back in and check the photo.',
  'domain.eventStore.saved_photo_continue_account_changed':
    'You changed accounts before the saved event photo could continue. Try again.',
  'domain.eventStore.sign_in_resume_photo':
    'Sign in before resuming an event photo.',
  'domain.eventStore.saved_photo_unavailable':
    'That saved event photo is no longer available on this device.',
  'domain.eventStore.saved_photo_status_account_changed':
    'You changed accounts while the saved photo status was updating. Sign back in and check the photo.',
  'domain.eventStore.saved_photos_status_account_changed':
    'You changed accounts while saved photo statuses were updating.',
  'domain.eventStore.photo_review_start_account_changed':
    'You changed accounts before the photo review started. Try again.',
  'domain.eventStore.photo_decision_account_changed':
    'You changed accounts while the photo decision was updating. Check the photo before deciding again.',
  'domain.eventStore.organiser_decision_start_account_changed':
    'You changed accounts before the organiser decision started. Try again.',
  'domain.eventStore.organiser_decision_account_changed':
    'You changed accounts while the organiser decision was updating. Check the photo before deciding again.',
  'domain.eventStore.photo_delete_start_account_changed':
    'You changed accounts before photo deletion started. Try again.',
  'domain.eventStore.photo_delete_finish_account_changed':
    'You changed accounts while photo deletion was finishing. Check whether the photo is still there.',

  'domain.handoff.invite_saved': 'Invite saved',
  'domain.handoff.referral_saved': 'Referral code saved',
  'domain.handoff.invite_description':
    '{action} and Menta will open your saved {inviteType} invite.',
  'domain.handoff.referral_login_description':
    'If this is a new account, Menta will check the code after sign-in. Any available reward will appear in your account.',
  'domain.handoff.referral_signup_description':
    'Create your account and Menta will check whether the code qualifies for a reward.',
  'domain.handoff.referral_login_new_description':
    'If this is a new account, Menta will check the code after sign-in.',
  'domain.handoff.referral_finish_description':
    'Finish setup and Menta will check whether the code qualifies for a reward.',
  'domain.handoff.referral_setup_description':
    'Create your account and Menta will check the code after setup.',
  'domain.handoff.next': 'Next',
  'domain.handoff.then': 'Then',
  'domain.handoff.step_one': 'Step 1',
  'domain.handoff.step_two': 'Step 2',
  'domain.handoff.step_three': 'Step 3',
  'domain.handoff.promise': 'Promise',
  'domain.handoff.invite': 'Invite',
  'domain.handoff.account': 'Account',
  'domain.handoff.sign_in_any_method': 'Sign in with any method',
  'domain.handoff.open_saved_invite': 'Open saved {inviteType} invite',
  'domain.handoff.sign_in_or_create': 'Sign in or create account',
  'domain.handoff.check_referral': 'Check saved referral code',
  'domain.handoff.check_referral_short': 'Check referral code',
  'domain.handoff.create_account': 'Create account',
  'domain.handoff.open_menta': 'Open Menta',
  'domain.handoff.continue_invite': 'Continue from the invite',
  'domain.handoff.show_reward': 'Show any available reward',
  'domain.handoff.create_first_promise': 'Create your first promise',
  'domain.handoff.continue_menta': 'Continue in Menta',
  'domain.handoff.saving_account': 'Saving to your account',
  'domain.handoff.waiting_after_sign_in': 'Waiting after sign-in',
  'domain.handoff.connecting': 'Connecting',
  'domain.handoff.open_today': 'Open Today',
  'domain.handoff.finish_setup': 'Finish setup',
  'domain.handoff.create_your_account': 'Create your account',
  'domain.handoff.complete_sign_in': 'Complete sign-in',
  'domain.handoff.sign_in': 'Sign in',

  'domain.coach.default_promise': 'your promise',
  'domain.coach.default_due_time': '8:00 PM',
  'domain.coach.proof_due': 'Proof is due.',
  'domain.coach.proof_due_body':
    'Add proof by {proofDueLabel} to finish today’s check-in.',
  'domain.coach.today_counts': 'Today still counts.',
  'domain.coach.hours_left': '{hours} {hourLabel} left for today’s proof.',
  'domain.coach.add_before_day_end': 'Add today’s proof before the day ends.',
  'domain.coach.log_proof': 'Log today’s proof.',
  'domain.coach.promises_need_proof':
    '{count} {promiseLabel} still need proof. Start with one.',
  'domain.coach.add_to_finish': 'Add proof to finish today.',
  'domain.coach.still_time': 'There’s still time today.',
  'domain.coach.proof_open_until':
    'Today’s proof stays open until {proofDueLabel}.',
  'domain.coach.proof_still_open': 'Today’s proof is still open.',
  'domain.coach.completed_add_proof':
    'If you completed your promise, add the proof before the day ends.',
  'domain.coach.next_small_step': 'Choose the next small step.',
  'domain.coach.proof_remains_open':
    'Today’s proof remains open until the day ends.',
  'domain.coach.hour_count': '{count} {hourLabel}',
  'domain.coach.hour_count.one': '{count} hour',
  'domain.coach.hour_count.other': '{count} hours',
  'domain.coach.promise_count': '{count} {promiseLabel}',
  'domain.coach.promise_count.one': '{count} promise',
  'domain.coach.promise_count.other': '{count} promises',
  'domain.coach.hour': 'hour',
  'domain.coach.hours': 'hours',
  'domain.coach.promise': 'promise',
  'domain.coach.promises': 'promises',

  'domain.report.draft_saved': 'Draft saved on this phone',
  'domain.report.nothing_sent': 'Nothing has been sent to support.',
  'domain.report.sending': 'Sending report',
  'domain.report.waiting_confirmation':
    'Menta is waiting for the server to confirm this exact report.',
  'domain.report.not_sent': 'Report not sent',
  'domain.report.remains_on_phone':
    'Your report remains on this phone. Nothing was delivered to support.',
  'domain.report.result_unknown': 'Send result unknown',
  'domain.report.could_not_confirm':
    'Menta could not confirm the server response. Retry uses the same report reference.',
  'domain.report.received': 'Report received',
  'domain.report.confirmed': 'Menta confirmed the report reached the server.',

  'domain.commitment.move_daily': 'Move daily',
  'domain.commitment.move_daily_description':
    'Move for a while each day. A walk, workout, stretch, or sport all count.',
  'domain.commitment.move_daily_promise': 'I will move my body once a day.',
  'domain.commitment.move_daily_verification':
    'Send a clear photo after you finish. Show the walk, workout, route, mat, gym, or result.',
  'domain.commitment.move_daily_submission':
    'Say what you did today and how long you moved.',
  'domain.commitment.daily_movement_group': 'Daily movement group',
  'domain.commitment.fitness': 'fitness',
  'domain.commitment.focused_study': 'Focused study',
  'domain.commitment.focused_study_description':
    'Finish one focused study session each day and note what you worked on.',
  'domain.commitment.focused_study_promise':
    'I will finish one focused study session each day.',
  'domain.commitment.focused_study_verification':
    'Write what you studied, how long you focused, and one thing you understand better now.',
  'domain.commitment.focused_study_submission':
    'Add the topic, time spent, and one thing you understand better now.',
  'domain.commitment.learning': 'learning',
  'domain.commitment.morning_walk': 'Morning walk',
  'domain.commitment.morning_walk_description':
    'Take a short walk early in the day.',
  'domain.commitment.morning_walk_promise': 'I will take a short morning walk.',
  'domain.commitment.morning_walk_verification':
    'Send a photo from the walk. A street, path, shoes, watch, or sky is enough.',
  'domain.commitment.morning_walk_submission':
    'Say where you walked and one thing you noticed.',
  'domain.commitment.morning_walk_group': 'Morning walk group',
  'domain.commitment.sleep_reset': 'Sleep reset',
  'domain.commitment.sleep_reset_description':
    'Start your wind-down before bed each evening.',
  'domain.commitment.sleep_reset_promise':
    'I will start my wind-down before bed.',
  'domain.commitment.sleep_reset_verification':
    'Write the wind-down action you completed and the time you started.',
  'domain.commitment.sleep_reset_submission':
    'Add the routine step you completed and what made tonight easier or harder.',
  'domain.commitment.sleep_reset_group': 'Sleep reset group',
  'domain.commitment.no_sugar': 'No sugar window',
  'domain.commitment.no_sugar_description':
    'Keep one clear food rule for seven days: no added sugar.',
  'domain.commitment.no_sugar_hub': 'No sugar',
  'domain.commitment.no_sugar_promise': 'I will avoid added sugar today.',
  'domain.commitment.no_sugar_verification':
    'Write whether you kept the rule and note any moment that made it difficult.',
  'domain.commitment.no_sugar_submission':
    'Add the hardest moment and what you chose instead.',
  'domain.commitment.no_sugar_group': 'No sugar group',
  'domain.commitment.creative_minutes': 'Creative minutes',
  'domain.commitment.creative_minutes_description':
    'Spend 20 minutes making or improving something each day.',
  'domain.commitment.creative_minutes_promise':
    'I will spend 20 minutes making something.',
  'domain.commitment.creative_minutes_verification':
    'Send a photo or screenshot of the work you made or changed today, such as a draft, sketch, timeline, or notes.',
  'domain.commitment.creative_minutes_submission':
    'Say what you made or improved during the 20 minutes.',
  'domain.commitment.creativity': 'creativity',
  'domain.commitment.health': 'health',
  'domain.commitment.creative_minutes_group': 'Creative minutes group',
  'domain.intensity.flexible': 'Flexible',
  'domain.intensity.standard': 'Standard',
  'domain.intensity.fixed': 'Fixed',
  'domain.intensity.shop_note':
    'A 12-hour deadline extension or streak freeze is bought in the shop, not chosen here.',
  'domain.intensity.flexible_note': 'Easier to keep on a busy week.',
  'domain.intensity.standard_note': 'A normal daily promise.',
  'domain.intensity.fixed_note': 'The most demanding of the three.',

  'domain.notifications.channel_updates': 'Updates from Menta',
  'domain.notifications.channel_reminders': 'Reminders before proof is due',
  'domain.notifications.channel_groups':
    'Check-ins, review requests and group changes',
  'domain.notifications.channel_progress':
    'Streak, badge, milestone and Momenta updates',
  'domain.notifications.channel_proof':
    'When proof is waiting, accepted or needs another try',
  'domain.notifications.new_milestone': 'New milestone',
  'domain.notifications.group_milestone_named': '{groupName}: {milestone}',
  'domain.notifications.group_milestone_reached': 'Group milestone reached',
  'domain.notifications.proof_due': 'Proof due',
  'domain.notifications.proof_for': 'Send proof for “{challengeTitle}”.',
  'domain.notifications.group_milestone': 'Group milestone reached',
  'domain.notifications.group_activity': 'New group activity',
  'domain.notifications.group_activity_named':
    '{memberName} has an update in {groupName}',
  'domain.notifications.proof_due_for': 'Proof is due for “{challengeTitle}”',
  'domain.notifications.proof_due_promise': 'Proof is due for your promise',
  'domain.notifications.open_update': 'Open Menta to see the update.',
  'domain.notifications.updated': 'Menta update',
  'domain.notifications.streak_updated': 'Streak updated',
  'domain.notifications.streak_protected': 'Streak protected',
  'domain.notifications.promise_started': 'Promise started',
  'domain.notifications.promise_complete': 'Promise complete',
  'domain.notifications.promise_ending': 'Promise ending soon',
  'domain.notifications.promise_ended': 'Promise ended',
  'domain.notifications.review_needed': 'Proof needs your review',
  'domain.notifications.proof_waiting': 'Proof waiting for review',
  'domain.notifications.proof_approved': 'Proof approved',
  'domain.notifications.proof_retry': 'Proof needs another try',
  'domain.notifications.group_update': 'Group update',
  'domain.notifications.group_attention': 'Group needs attention',
  'domain.notifications.daily_reminder': 'Daily reminder',
  'domain.notifications.check_in_reminder': 'Check-in reminder',
  'domain.notifications.badge_unlocked': 'Badge unlocked',
  'domain.notifications.momenta_added': 'Momenta added',
  'domain.notifications.menta_updated': 'Menta updated',
  'domain.notifications.menta_maintenance': 'Menta maintenance',
  'domain.notifications.test': 'Menta test notification',
  'domain.notifications.ending_in': 'Ends in {hours} {hourLabel}',
  'domain.notifications.ending_soon': 'Ending soon',
  'domain.notifications.group_submissions': 'Group submissions',
  'domain.notifications.members': 'Members',
  'domain.notifications.review': 'review',
  'domain.notifications.reviews': 'reviews',
} as const;
