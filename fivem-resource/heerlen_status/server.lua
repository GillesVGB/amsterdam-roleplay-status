local endpoint = 'https://amsterdam-roleplay-status.vercel.app/api/heartbeat'
local pending = false
local lastError = nil
local confirmed = false

CreateThread(function()
    while true do
        local token = GetConvar('heerlen_status_token', '')
        if token == '' then
            if lastError ~= 'config' then
                print('[heerlen_status] Laad config.cfg met exec voordat je deze resource start.')
                lastError = 'config'
            end
        elseif not pending then
            pending = true
            local payload = json.encode({
                players = #GetPlayers(),
                capacity = GetConvarInt('sv_maxclients', 0),
                sentAt = os.time()
            })
            PerformHttpRequest(endpoint, function(code)
                pending = false
                if code == 204 then
                    if not confirmed then
                        print('[heerlen_status] Verbonden: live spelerstelling wordt elke 15 seconden verstuurd.')
                        confirmed = true
                    end
                    lastError = nil
                elseif lastError ~= code then
                    print(('[heerlen_status] Statusmelding niet ontvangen (HTTP %s). Controleer HTTPS-toegang en configuratie.'):format(tostring(code)))
                    lastError = code
                    confirmed = false
                end
            end, 'POST', payload, {
                ['Content-Type'] = 'application/json',
                ['Authorization'] = 'Bearer ' .. token
            }, {followLocation = false})
        end
        Wait(15000)
    end
end)
